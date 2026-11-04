"""
app.py — InterviewIQ v4 Flask Backend
"""
import os, uuid, time
from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_engine import extract_text, extract_skills, generate_questions
from ai_engine  import ai_evaluate, generate_report, AdaptiveDifficultyEngine

app      = Flask(__name__)
CORS(app)
sessions = {}
ALLOWED  = {".pdf", ".docx", ".doc", ".txt"}


def get_sess(sid):
    s = sessions.get(sid)
    if not s:
        return None, jsonify({"error": "Session not found. Please upload your resume again."}), 404
    return s, None, None


def new_session(filename, text, skills, questions, difficulty):
    sid = str(uuid.uuid4())
    sessions[sid] = {
        "session_id":         sid,
        "filename":           filename,
        "resume_text":        text,
        "skills":             skills,
        "questions":          questions,
        "difficulty":         difficulty,
        "answered_questions": [],
        "current_index":      0,
        "difficulty_engine":  AdaptiveDifficultyEngine(difficulty),
        "created_at":         time.time(),
    }
    return sid


@app.route("/api/health")
def health():
    return jsonify({
        "status":   "ok",
        "version":  "4.0.0",
        "message":  "InterviewIQ v4 backend running",
        "ai_features": [
            "TF-IDF Vectorization",
            "Cosine Similarity",
            "Naive Bayes Classifier",
            "Adaptive Difficulty Engine",
            "Confidence Score Predictor",
        ],
    })


@app.route("/api/upload", methods=["POST"])
def upload():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400
    f   = request.files["resume"]
    ext = os.path.splitext(f.filename.lower())[1]
    if ext not in ALLOWED:
        return jsonify({"error": "Invalid file type. Use PDF, DOCX, or TXT."}), 400
    data = f.read()
    if len(data) > 5 * 1024 * 1024:
        return jsonify({"error": "File too large (max 5MB)."}), 400

    difficulty = request.form.get("difficulty", "medium")
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"

    text = extract_text(data, f.filename)
    if len(text.strip()) < 50:
        return jsonify({"error": "Could not extract text. Try a different format."}), 422

    skills = extract_skills(text)
    if not skills:
        return jsonify({"error": "No recognizable skills found in the resume."}), 422

    questions = generate_questions(skills, difficulty=difficulty, max_total=20)
    sid       = new_session(f.filename, text, skills, questions, difficulty)
    return jsonify({
        "session_id":      sid,
        "filename":        f.filename,
        "skills_found":    len(skills),
        "skills":          skills,
        "total_questions": len(questions),
        "difficulty":      difficulty,
        "message":         f"Found {len(skills)} skills → {len(questions)} {difficulty}-level questions ready!",
    })


@app.route("/api/demo")
def demo():
    difficulty = request.args.get("difficulty", "medium")
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"
    sample = (
        "Name: Nandan — Software Engineer\n"
        "Skills: Python, Machine Learning, Deep Learning, SQL, React, Flask, "
        "Data Structures, Algorithms, Git, Docker, NLP, JavaScript, Communication, Leadership\n"
        "Experience: Built REST APIs in Python Flask. Trained ML models with scikit-learn. "
        "React.js frontend. SQL databases. Docker containers. NLP pipelines.\n"
    )
    skills    = extract_skills(sample)
    questions = generate_questions(skills, difficulty=difficulty, max_total=20)
    sid       = new_session("demo_resume.txt", sample, skills, questions, difficulty)
    return jsonify({
        "session_id":      sid,
        "skills_found":    len(skills),
        "skills":          skills,
        "total_questions": len(questions),
        "difficulty":      difficulty,
        "message":         "Demo session created!",
    })


@app.route("/api/skills/<sid>")
def get_skills(sid):
    s, e, c = get_sess(sid)
    if e: return e, c
    return jsonify({"skills": s["skills"], "total": len(s["skills"]), "difficulty": s["difficulty"]})


@app.route("/api/questions/<sid>")
def get_questions(sid):
    s, e, c = get_sess(sid)
    if e: return e, c
    qs = [{
        "id": q["id"], "skill": q["skill"], "display_skill": q["display_skill"],
        "category": q["category"], "question": q["question"],
        "difficulty": q["difficulty"], "answered": bool(q.get("answer")),
        "score": q.get("score"),
    } for q in s["questions"]]
    return jsonify({"questions": qs, "total": len(qs),
                    "current_index": s["current_index"], "difficulty": s["difficulty"]})


@app.route("/api/question/<sid>/current")
def current_q(sid):
    s, e, c = get_sess(sid)
    if e: return e, c
    idx = s["current_index"]
    qs  = s["questions"]
    if idx >= len(qs):
        return jsonify({"completed": True, "total_questions": len(qs)})
    q   = qs[idx]
    eng = s["difficulty_engine"]
    return jsonify({
        "completed":        False,
        "question_number":  idx + 1,
        "total_questions":  len(qs),
        "progress_percent": round((idx / len(qs)) * 100),
        "id":               q["id"],
        "skill":            q["display_skill"],
        "category":         q["category"],
        "question":         q["question"],
        "difficulty":       q["difficulty"],
        "ai_status":        eng.status(),
    })


@app.route("/api/answer/<sid>", methods=["POST"])
def submit_answer(sid):
    s, e, c = get_sess(sid)
    if e: return e, c
    body = request.get_json()
    if not body:        return jsonify({"error": "No JSON body."}), 400
    qid    = body.get("question_id")
    answer = (body.get("answer") or "").strip()
    if qid is None:     return jsonify({"error": "question_id required."}), 400

    target = next((q for q in s["questions"] if q["id"] == qid), None)
    if not target:      return jsonify({"error": f"Question {qid} not found."}), 404

    eng    = s["difficulty_engine"]
    result = ai_evaluate(target, answer, eng)

    target.update({
        "answer":          answer,
        "score":           result["score"],
        "semantic_score":  result["semantic_score"],
        "feedback":        result["feedback"],
        "keywords_found":  result["keywords_found"],
        "keywords_missed": result["keywords_missed"],
        "nb_label":        result["nb_classification"]["label"],
        "quality":         result["quality"],
    })
    s["answered_questions"].append(target)

    if (s["current_index"] < len(s["questions"]) and
            s["questions"][s["current_index"]]["id"] == qid):
        s["current_index"] += 1

    done = s["current_index"] >= len(s["questions"])
    return jsonify({
        "evaluated":         True,
        "question_id":       qid,
        "score":             result["score"],
        "quality":           result["quality"],
        "semantic_pct":      result["semantic_pct"],
        "nb_classification": result["nb_classification"],
        "feedback":          result["feedback"],
        "keywords_found":    result["keywords_found"],
        "keywords_missed":   result["keywords_missed"],
        "difficulty_status": result["difficulty_status"],
        "all_completed":     done,
        "next_question_number": None if done else s["current_index"] + 1,
        "progress_percent":  round((s["current_index"] / len(s["questions"])) * 100),
    })


@app.route("/api/report/<sid>")
def get_report(sid):
    s, e, c = get_sess(sid)
    if e: return e, c
    answered = s.get("answered_questions", [])
    if not answered:
        return jsonify({"error": "No answers submitted yet."}), 400

    report = generate_report({
        "answered_questions": answered,
        "skills":             s["skills"],
        "questions":          s["questions"],
    })
    report["session_id"] = sid
    report["filename"]   = s.get("filename", "resume")
    report["difficulty"] = s.get("difficulty", "medium")
    report["answered_questions"] = [{
        "id":              q["id"],
        "skill":           q.get("display_skill", q["skill"]),
        "category":        q["category"],
        "question":        q["question"],
        "difficulty":      q.get("difficulty", "medium"),
        "answer":          q.get("answer", ""),
        "score":           q.get("score", 0),
        "semantic_score":  q.get("semantic_score", 0),
        "nb_label":        q.get("nb_label", ""),
        "quality":         q.get("quality", ""),
        "feedback":        q.get("feedback", ""),
        "keywords_found":  q.get("keywords_found", []),
        "keywords_missed": q.get("keywords_missed", []),
    } for q in answered]
    return jsonify(report)


@app.route("/api/reset/<sid>", methods=["POST"])
def reset(sid):
    s, e, c = get_sess(sid)
    if e: return e, c
    body     = request.get_json(silent=True) or {}
    new_diff = body.get("difficulty", s["difficulty"])
    for q in s["questions"]:
        q.update({"answer": "", "score": None, "feedback": "",
                  "semantic_score": 0, "keywords_found": [],
                  "keywords_missed": [], "nb_label": "", "quality": ""})
    s["answered_questions"] = []
    s["current_index"]      = 0
    s["difficulty"]         = new_diff
    s["difficulty_engine"]  = AdaptiveDifficultyEngine(new_diff)
    return jsonify({"message": "Reset done.", "session_id": sid, "difficulty": new_diff})


@app.errorhandler(404)
def not_found(e): return jsonify({"error": "Endpoint not found."}), 404
@app.errorhandler(500)
def server_err(e): return jsonify({"error": "Server error.", "detail": str(e)}), 500


if __name__ == "__main__":
    print("=" * 52)
    print("  InterviewIQ v4 — AI-Powered Interview System")
    print("  http://localhost:5000")
    print("=" * 52)
    app.run(debug=True, host="0.0.0.0", port=5000)
