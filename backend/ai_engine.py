"""
ai_engine.py — InterviewIQ v4 AI Module
=========================================
AI Concepts Used:
  1. TF-IDF Vectorization   (sklearn)
  2. Cosine Similarity      (sklearn)
  3. Naive Bayes Classifier (sklearn)
  4. Adaptive Difficulty Engine
  5. Confidence Score Predictor

FIXED SCORING (v4):
  50 pts  keyword overlap   (most reliable — directly measures content)
  30 pts  TF-IDF cosine     (semantic closeness)
  20 pts  answer length     (completeness proxy)
  ─────
  100 pts total
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.naive_bayes import MultinomialNB
from skills_db import SKILLS_DB

# ── Ideal reference answers for semantic scoring ──────────────────────────────
IDEAL = {
    "python":
        "Python is an interpreted high level dynamically typed programming language. "
        "It supports object oriented functional and procedural paradigms. Key features "
        "include automatic memory management garbage collection extensive standard library "
        "list comprehensions generators decorators exception handling and simple indentation. "
        "Widely used in AI ML web development data science and automation.",
    "java":
        "Java is statically typed object oriented language write once run anywhere via JVM. "
        "Supports encapsulation inheritance polymorphism abstraction. Garbage collection "
        "strong type system interfaces abstract classes multithreading Java Collections "
        "Framework ArrayList HashMap LinkedList. JDK development kit JRE runtime JVM executes bytecode.",
    "javascript":
        "JavaScript is dynamically typed interpreted scripting language for web. var function scope "
        "let const block scope. Closures allow inner functions access outer variables. "
        "Event loop handles async operations single threaded. Promises async await asynchronous. "
        "Prototype chain enables inheritance. DOM manipulation browser interaction.",
    "sql":
        "SQL manages relational databases structured query language. INNER JOIN matching rows "
        "LEFT JOIN all from left table. Primary key uniquely identifies rows foreign key "
        "references another table. Normalization eliminates redundancy 1NF 2NF 3NF. "
        "Indexes improve performance. ACID atomicity consistency isolation durability.",
    "machine learning":
        "Machine learning systems learn from data without explicit programming. "
        "Supervised learning uses labeled data classification regression. "
        "Unsupervised learning finds patterns unlabeled data clustering. "
        "Overfitting memorizes training data fails new data. Cross validation evaluates performance. "
        "Bias variance tradeoff. Accuracy precision recall F1 confusion matrix.",
    "deep learning":
        "Deep learning uses neural networks multiple hidden layers. Backpropagation adjusts weights "
        "gradient descent minimize loss function. Vanishing gradient problem deep networks. "
        "CNN convolutional layers image recognition pooling. RNN LSTM sequential data. "
        "Transfer learning reuses pretrained models. Activation functions ReLU sigmoid softmax.",
    "nlp":
        "Natural Language Processing enables computers understand human language. "
        "Tokenization splits text words sentences. TF-IDF term frequency inverse document frequency "
        "measures word importance. Word embeddings Word2Vec GloVe represent words vectors. "
        "Named Entity Recognition identifies persons organizations locations. "
        "BERT bidirectional transformers contextual embeddings.",
    "react":
        "React JavaScript library building user interfaces reusable components. "
        "Virtual DOM lightweight copy real DOM efficient updates diffing. "
        "State mutable data within component props immutable passed from parent. "
        "Hooks useState useEffect useContext functional components. "
        "Component lifecycle mounting updating unmounting. Redux global state management.",
    "node.js":
        "Node.js runs JavaScript server Chrome V8 engine. Single threaded handles concurrent "
        "requests event loop. Non blocking IO offloads slow tasks background threads. "
        "Express routing middleware REST APIs. npm manages packages dependencies. "
        "Callbacks promises async await asynchronous code patterns.",
    "flask":
        "Flask lightweight WSGI Python web framework building APIs. Routes defined app.route decorator "
        "maps URLs functions. Blueprints organize large applications modular components. "
        "Handles HTTP request response objects. Jinja2 templating engine renders HTML. "
        "Flask CORS cross origin requests. Used building REST APIs microservices.",
    "data structures":
        "Data structures organize data efficient access modification. Arrays O(1) access O(n) insertion. "
        "Linked lists O(1) insertion O(n) access. Stack LIFO queue FIFO. "
        "Binary search tree O(log n) balanced. Hash tables O(1) average hash functions collision. "
        "BFS queue level by level DFS stack depth first graph traversal.",
    "algorithms":
        "Algorithms step by step procedures solving computational problems. BFS explores level "
        "by level queue DFS depth first stack. Dynamic programming overlapping subproblems memoization. "
        "Greedy locally optimal choices. QuickSort O(n log n) average O(n squared) worst. "
        "Binary search O(log n) sorted array. Time space complexity Big O notation.",
    "git":
        "Git distributed version control system tracking code changes. git add stages git commit "
        "saves snapshot git push sends remote. Merge combines branches preserving history "
        "rebase rewrites linearly. Pull requests code review. Merge conflicts same lines modified. "
        "Branches parallel development isolation.",
    "docker":
        "Docker containerizes applications all dependencies. Images read only templates "
        "containers running instances. Dockerfile build instructions layer by layer. "
        "Docker Compose orchestrates multi container applications YAML. Volumes persist data "
        "outside container lifecycle. Networks enable container communication.",
    "aws":
        "AWS cloud computing services. EC2 virtual servers Lambda serverless functions. "
        "S3 object storage. IAM identity access management users roles policies. "
        "VPC virtual private cloud network isolation. Auto scaling adjusts capacity demand. "
        "RDS managed relational database. CloudWatch monitoring logging.",
    "communication":
        "Effective communication requires clarity active listening audience awareness. "
        "Technical concepts simplified non technical stakeholders. Written communication "
        "structure grammar clarity. Feedback specific constructive behavior focused. "
        "Empathy understanding perspective builds professional relationships. "
        "Verbal nonverbal body language tone eye contact.",
    "leadership":
        "Leadership guiding motivating inspiring teams toward shared goals. Delegation assigns "
        "tasks strengths development needs. Conflict resolution active listening empathy win-win. "
        "Accountability responsibility outcomes follow through commitments. "
        "Mentoring develops team skills organizational capability. Decision making gathering "
        "information evaluating options taking action.",
}


# ── AI CONCEPT 1 + 2: TF-IDF + Cosine Similarity ─────────────────────────────
class SemanticScorer:
    """Converts answers to TF-IDF vectors and measures cosine similarity."""
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english', ngram_range=(1, 2),
            max_features=3000, sublinear_tf=True
        )

    def score(self, user_answer: str, ideal: str) -> float:
        if not user_answer or len(user_answer.strip()) < 5:
            return 0.0
        try:
            docs = [user_answer.lower(), ideal.lower()]
            m    = self.vectorizer.fit_transform(docs)
            return float(cosine_similarity(m[0:1], m[1:2])[0][0])
        except:
            return 0.0

semantic_scorer = SemanticScorer()


# ── AI CONCEPT 3: Naive Bayes Classifier ─────────────────────────────────────
class AnswerQualityClassifier:
    """Classifies answer quality using MultinomialNB trained on sample answers."""
    LABELS = ["Poor", "Average", "Good", "Excellent"]
    TRAIN  = [
        ("i dont know skip no idea pass", 0),
        ("not sure i think maybe", 0),
        ("it is related to programming software computers", 0),
        ("it is something used for development", 1),
        ("it is a language used for building applications", 1),
        ("it works with data and processes information", 1),
        ("it helps developers build and manage applications efficiently", 1),
        ("it is a programming language that supports object oriented concepts classes objects inheritance", 2),
        ("the framework provides routing middleware handles http requests responses", 2),
        ("uses supervised learning training data build predictive models evaluate accuracy features labels", 2),
        ("processes text using tokenization tfidf embeddings natural language understanding", 2),
        ("manages state props components virtual dom hooks lifecycle methods rendering", 2),
        ("interpreted dynamically typed language supporting oop functional paradigms garbage collection memory management", 3),
        ("backpropagation gradient descent neural networks multiple hidden layers minimize loss function weight optimization", 3),
        ("tfidf vectorization cosine similarity semantic matching information retrieval sklearn", 3),
        ("binary search tree logarithmic time complexity balanced avl trees insert delete search", 3),
        ("supervised unsupervised learning labeled data mapping features output minimizing prediction error cross validation", 3),
        ("virtual dom reconciliation diffing algorithm efficient minimal dom updates component tree rendering", 3),
        ("docker containerization images dockerfile compose volume network registry build deploy", 3),
        ("sql joins normalization acid transaction index primary foreign key query optimize", 3),
    ]

    def __init__(self):
        self.vec = TfidfVectorizer(stop_words='english', max_features=600)
        self.clf = MultinomialNB(alpha=0.4)
        texts  = [t for t, _ in self.TRAIN]
        labels = [l for _, l in self.TRAIN]
        X = self.vec.fit_transform(texts)
        self.clf.fit(X, labels)

    def classify(self, answer: str) -> dict:
        if not answer.strip():
            return {"label": "Poor", "confidence": 1.0, "probabilities": {}}
        try:
            X     = self.vec.transform([answer.lower()])
            idx   = self.clf.predict(X)[0]
            probs = self.clf.predict_proba(X)[0]
            return {
                "label":         self.LABELS[idx],
                "confidence":    round(float(probs[idx]), 3),
                "probabilities": {self.LABELS[i]: round(float(p), 3) for i, p in enumerate(probs)}
            }
        except:
            return {"label": "Average", "confidence": 0.5, "probabilities": {}}

quality_classifier = AnswerQualityClassifier()


# ── AI CONCEPT 4: Adaptive Difficulty Engine ──────────────────────────────────
class AdaptiveDifficultyEngine:
    """
    Tracks live scores and adjusts difficulty for next question.
    High scores (avg > 75) → move to hard
    Low scores  (avg < 40) → move to easy
    Otherwise stays at the user-chosen base difficulty.
    """
    def __init__(self, base="medium"):
        self.base        = base
        self.current     = base
        self.history     = []
        self.adjustments = 0

    def update(self, score: int):
        self.history.append(score)
        recent  = self.history[-3:]
        avg     = sum(recent) / len(recent)
        old     = self.current
        if   avg >= 75: self.current = "hard"
        elif avg <= 40: self.current = "easy"
        else:           self.current = self.base
        if self.current != old:
            self.adjustments += 1

    def status(self) -> dict:
        recent = self.history[-3:] if self.history else []
        return {
            "current":     self.current,
            "adjustments": self.adjustments,
            "recent_avg":  round(sum(recent) / max(len(recent), 1), 1),
            "history":     self.history[-5:],
        }


# ── AI CONCEPT 5: Confidence Score Predictor ─────────────────────────────────
class ConfidencePredictor:
    """Weighted ML model predicting interview readiness from 5 features."""
    W = {"sem": 0.35, "length": 0.15, "coverage": 0.20, "trend": 0.15, "balance": 0.15}

    def predict(self, answered: list, skills: list) -> dict:
        if not answered:
            return {"score": 0, "readiness": "Not Started", "breakdown": {}}

        scores   = [a.get("score", 0) or 0 for a in answered]
        sems     = [a.get("semantic_score", 0) or 0 for a in answered]
        lens     = [len(a.get("answer", "")) for a in answered]

        avg_sem  = sum(sems) / len(sems) if sems else 0
        len_sc   = min(1.0, (sum(lens) / len(lens)) / 200) if lens else 0
        coverage = min(1.0, len(set(a.get("skill", "") for a in answered)) / max(len(skills), 1))

        trend = 0.5
        if len(scores) >= 4:
            h  = len(scores) // 2
            f  = sum(scores[:h]) / h
            s2 = sum(scores[h:]) / (len(scores) - h)
            trend = min(1.0, max(0.0, (s2 - f + 100) / 200))

        cats    = set(a.get("category", "") for a in answered)
        tech    = any(c in ["Programming","AI/ML","CS Fundamentals","Database","Web Development"] for c in cats)
        soft    = any(c == "Soft Skills" for c in cats)
        balance = 1.0 if (tech and soft) else 0.6

        raw  = (avg_sem  * self.W["sem"]      * 100 +
                len_sc   * self.W["length"]   * 100 +
                coverage * self.W["coverage"] * 100 +
                trend    * self.W["trend"]    * 100 +
                balance  * self.W["balance"]  * 100)
        conf = min(100, max(0, round(raw)))

        if   conf >= 80: readiness = "Highly Ready 🔥"
        elif conf >= 65: readiness = "Ready ✅"
        elif conf >= 50: readiness = "Moderately Ready 📈"
        elif conf >= 35: readiness = "Needs Preparation 📚"
        else:            readiness = "Not Ready ⚠️"

        return {
            "score":    conf,
            "readiness":readiness,
            "breakdown": {
                "Semantic Match":      round(avg_sem  * 100, 1),
                "Answer Completeness": round(len_sc   * 100, 1),
                "Skill Coverage":      round(coverage * 100, 1),
                "Improvement Trend":   round(trend    * 100, 1),
                "Category Balance":    round(balance  * 100, 1),
            }
        }

confidence_predictor = ConfidencePredictor()


# ── MASTER EVALUATION ─────────────────────────────────────────────────────────
def ai_evaluate(question_obj: dict, user_answer: str,
                engine: AdaptiveDifficultyEngine = None) -> dict:
    """
    FIXED SCORING:
      50 pts  keyword match   (core content check)
      30 pts  TF-IDF cosine   (semantic similarity)
      20 pts  answer length   (completeness)
    """
    skill = question_obj.get("skill", "")
    ans   = user_answer.strip()

    if not ans or len(ans) < 4:
        if engine: engine.update(0)
        return _build_result(0, "Very Poor",
            "No answer provided. Please type or speak your answer.",
            [], [], 0.0, {"label":"Poor","confidence":1.0}, engine)

    ans_lower = ans.lower()

    # ── Component 1: Keyword match (0–50) ────────────────
    keywords  = SKILLS_DB.get(skill, {}).get("keywords", [])
    found_kws = [k for k in keywords if k in ans_lower]
    miss_kws  = [k for k in keywords if k not in ans_lower]
    kw_score  = int((len(found_kws) / max(len(keywords), 1)) * 50) if keywords else 15

    # ── Component 2: TF-IDF cosine similarity (0–30) ─────
    ideal  = IDEAL.get(skill, ans[:80])
    sem    = semantic_scorer.score(ans, ideal)
    sem_sc = int(sem * 30)

    # ── Component 3: Length bonus (0–20) ─────────────────
    len_sc = min(20, int((len(ans) / 120) * 20))

    total  = min(100, kw_score + sem_sc + len_sc)

    # ── Naive Bayes quality label ─────────────────────────
    nb = quality_classifier.classify(ans)

    # ── Quality label from total score ───────────────────
    if   total >= 80: quality = "Excellent"
    elif total >= 60: quality = "Good"
    elif total >= 40: quality = "Average"
    elif total >= 20: quality = "Poor"
    else:             quality = "Very Poor"

    # ── Smart feedback ────────────────────────────────────
    sem_pct = round(sem * 100, 1)
    parts   = []
    if quality == "Excellent":
        parts.append(f"Outstanding! {sem_pct}% semantic match with ideal answer.")
    elif quality == "Good":
        parts.append(f"Good answer — {sem_pct}% semantic match. Add more depth to score higher.")
    elif quality == "Average":
        parts.append(f"Partial understanding ({sem_pct}% match). Include more technical terms.")
    else:
        parts.append(f"Low match ({sem_pct}%). Study the core concepts and try again.")

    if found_kws: parts.append(f"✅ Good terms: {', '.join(found_kws[:5])}.")
    if miss_kws[:4]: parts.append(f"💡 Try including: {', '.join(miss_kws[:4])}.")
    parts.append(f"[AI Classifier → {nb['label']} ({round(nb['confidence']*100)}% confidence)]")

    if engine: engine.update(total)
    return _build_result(total, quality, " ".join(parts),
                         found_kws, miss_kws[:5], sem, nb, engine)


def _build_result(score, quality, feedback, found, missed, sem, nb, engine):
    return {
        "score":            score,
        "quality":          quality,
        "feedback":         feedback,
        "keywords_found":   found,
        "keywords_missed":  missed,
        "semantic_score":   round(sem, 4),
        "semantic_pct":     round(sem * 100, 1),
        "nb_classification":nb,
        "difficulty_status":engine.status() if engine else {},
    }


# ── REPORT GENERATION ─────────────────────────────────────────────────────────
def generate_report(session: dict) -> dict:
    answered = session.get("answered_questions", [])
    skills   = session.get("skills", [])
    if not answered: return {}

    scores  = [q.get("score", 0) or 0 for q in answered]
    sems    = [q.get("semantic_score", 0) or 0 for q in answered]
    avg     = round(sum(scores) / len(scores), 1)
    avg_sem = round(sum(sems) / len(sems) * 100, 1)

    skill_map = {}
    for q in answered:
        sk = q.get("display_skill", "General")
        if sk not in skill_map:
            skill_map[sk] = {"scores":[], "sems":[], "category":q.get("category","")}
        skill_map[sk]["scores"].append(q.get("score", 0) or 0)
        skill_map[sk]["sems"].append(q.get("semantic_score", 0) or 0)

    skill_summary = {
        sk: {
            "avg":      round(sum(d["scores"]) / len(d["scores"]), 1),
            "sem_avg":  round(sum(d["sems"])   / len(d["sems"]) * 100, 1),
            "count":    len(d["scores"]),
            "category": d["category"],
        } for sk, d in skill_map.items()
    }

    if   avg >= 80: grade, verdict = "A", "Excellent — Interview Ready! 🎉"
    elif avg >= 65: grade, verdict = "B", "Good — Minor improvements needed."
    elif avg >= 50: grade, verdict = "C", "Average — Keep practicing consistently."
    elif avg >= 35: grade, verdict = "D", "Below Average — More focused study needed."
    else:           grade, verdict = "F", "Needs significant improvement."

    sorted_sk = sorted(skill_summary.items(), key=lambda x: x[1]["avg"], reverse=True)
    strongest = [s[0] for s in sorted_sk[:3]]
    weakest   = [s[0] for s in sorted_sk if s[1]["avg"] < 55][:4]

    recs  = _build_recommendations(answered, weakest, avg, avg_sem, scores, session)
    conf  = confidence_predictor.predict(answered, skills)

    return {
        "total_questions":     len(session.get("questions", [])),
        "questions_attempted": len(answered),
        "avg_score":           avg,
        "avg_semantic":        avg_sem,
        "grade":               grade,
        "verdict":             verdict,
        "skill_summary":       skill_summary,
        "strongest_skills":    strongest,
        "weakest_skills":      weakest,
        "confidence":          conf,
        "recommendations":     recs,
        "ai_features": [
            "TF-IDF Vectorization (sklearn)",
            "Cosine Similarity — Semantic Scoring",
            "Naive Bayes Classifier (MultinomialNB)",
            "Adaptive Difficulty Engine",
            "Confidence Score Predictor",
        ],
    }


def _build_recommendations(answered, weakest, avg, avg_sem, scores, session):
    recs = []

    # Skill-specific
    for sk in weakest:
        skl = sk.lower()
        if any(x in skl for x in ["python","java","javascript","c++"]):
            recs.append(f"📌 {sk}: Practice writing small programs daily. Focus on core OOP concepts and syntax. Solve 3 LeetCode Easy problems per day to build coding confidence.")
        elif any(x in skl for x in ["sql","database","dbms"]):
            recs.append(f"📌 {sk}: Practice 2 SQL queries daily on HackerRank SQL section. Master JOINs, GROUP BY, subqueries — these appear in almost every company interview.")
        elif any(x in skl for x in ["machine learning","deep learning","nlp","ai"]):
            recs.append(f"📌 {sk}: Build one small ML project using scikit-learn. Be ready to explain overfitting, cross-validation, and model evaluation metrics clearly in simple English.")
        elif any(x in skl for x in ["react","node","javascript","flask"]):
            recs.append(f"📌 {sk}: Build a small CRUD app with this technology. Practice explaining Virtual DOM, event loop, hooks — interviewers ask these in almost every frontend/backend round.")
        elif any(x in skl for x in ["data structure","algorithm"]):
            recs.append(f"📌 {sk}: Solve 3 LeetCode Easy problems daily. Arrays, strings, hashmaps cover 60% of fresher interview questions. Time yourself — aim for under 20 minutes per problem.")
        else:
            recs.append(f"📌 {sk}: Review core concepts and practice explaining them in 3-4 clear sentences. Use real-world analogies — they show you truly understand the topic.")

    # Semantic score recommendation
    if avg_sem < 35:
        recs.append("💬 Your answers lack technical vocabulary. Study the key terms for each topic and use them naturally. Interviewers specifically listen for technical keywords to judge depth of knowledge.")
    elif avg_sem < 55:
        recs.append("💬 Your answers are on the right track but need more technical depth. Try the approach: explain WHAT it is → HOW it works → WHY it is used. This structure works for any technical concept.")

    # Answer length recommendation
    avg_len = sum(len(a.get("answer","")) for a in answered) / max(len(answered), 1)
    if avg_len < 80:
        recs.append("📝 Your answers are too short. Aim for at least 4-5 sentences per answer. Brief answers signal to interviewers that you don't know the topic deeply enough.")
    elif avg_len < 150:
        recs.append("📝 Expand your answers with a real-world example or analogy after explaining the concept. Interviewers remember candidates who explain things with clear, relatable examples.")

    # Trend analysis
    if len(scores) >= 4:
        h  = len(scores) // 2
        f  = sum(scores[:h]) / h
        s2 = sum(scores[h:]) / (len(scores) - h)
        if s2 > f + 10:
            recs.append("📈 Great improvement during the interview — your answers got better as you progressed! This shows ability to think under pressure. Keep this consistency in real interviews.")
        elif s2 < f - 10:
            recs.append("⚠️ Your scores dropped in the second half. This may indicate fatigue or less familiar topics. Practice all topics equally — interviewers often ask harder questions later in the interview.")

    # Overall verdict
    if avg >= 75:
        recs.append("🌟 Strong overall performance! You are close to interview-ready. Focus on verbal fluency — practice speaking answers out loud, not just writing them. Confidence in tone matters as much as content.")
    elif avg >= 55:
        recs.append("🎯 You are halfway there. Spend 30 focused minutes daily on weak skills. Two weeks of consistent practice will make a significant difference in your interview performance.")
    else:
        recs.append("📚 Build fundamentals first. Start with OOP and SQL — they are tested by almost every company. Master one concept per day with a clear explanation, then move to the next.")

    # Skipped questions
    total = len(session.get("questions", []))
    skipped = total - len(answered)
    if skipped > 0:
        recs.append(f"⏭️ You skipped {skipped} question(s). In real interviews you cannot skip — always attempt every question. A partial answer with some correct points is far better than silence.")

    return recs[:6]
