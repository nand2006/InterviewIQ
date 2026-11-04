"""
nlp_engine.py — Resume parsing and skill extraction
"""
import re, io
from pdfminer.high_level import extract_text as pdf_extract
from docx import Document
from skills_db import SKILLS_DB, SKILL_ALIASES


def extract_text_from_pdf(b):
    try: return pdf_extract(io.BytesIO(b)) or ""
    except Exception as e: return f"[PDF error: {e}]"

def extract_text_from_docx(b):
    try:
        doc = Document(io.BytesIO(b))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e: return f"[DOCX error: {e}]"

def extract_text(file_bytes, filename):
    fn = filename.lower()
    if fn.endswith(".pdf"):            return extract_text_from_pdf(file_bytes)
    if fn.endswith((".docx", ".doc")): return extract_text_from_docx(file_bytes)
    if fn.endswith(".txt"):            return file_bytes.decode("utf-8", errors="ignore")
    text = extract_text_from_pdf(file_bytes)
    if "[PDF error" not in text and len(text.strip()) > 50: return text
    return extract_text_from_docx(file_bytes)

def _clean(text):
    text = text.lower()
    text = re.sub(r'[^\w\s\.\+\#]', ' ', text)
    return re.sub(r'\s+', ' ', text)

def _display(key):
    return (key.title()
        .replace("Nlp","NLP").replace("Sql","SQL").replace("Aws","AWS")
        .replace("Css","CSS").replace("Html","HTML").replace("Dbms","DBMS")
        .replace(".Js",".js").replace("Node.js","Node.js"))

def extract_skills(resume_text):
    norm  = _clean(resume_text)
    found = {}
    for key in SKILLS_DB:
        m = re.findall(r'\b' + re.escape(key) + r'\b', norm)
        if m:
            found[key] = {
                "skill":        key,
                "display_name": _display(key),
                "category":     SKILLS_DB[key]["category"],
                "match_count":  len(m),
            }
    for alias, canonical in SKILL_ALIASES.items():
        if canonical in found: continue
        m = re.findall(r'\b' + re.escape(alias) + r'\b', norm)
        if m and canonical in SKILLS_DB:
            found[canonical] = {
                "skill":        canonical,
                "display_name": _display(canonical),
                "category":     SKILLS_DB[canonical]["category"],
                "match_count":  len(m),
            }
    return sorted(found.values(), key=lambda x: x["match_count"], reverse=True)

def generate_questions(skills, difficulty="medium", max_total=20):
    """
    - 1 guaranteed question per skill at chosen difficulty
    - Fill remaining budget up to max_total
    - Never exceed 3 questions per skill
    """
    if not skills: return []
    questions, q_id = [], 1

    # Pass 1: 1 question per skill
    for s in skills:
        key  = s["skill"]
        if key not in SKILLS_DB: continue
        pool = SKILLS_DB[key].get(difficulty, SKILLS_DB[key]["medium"])
        questions.append(_make_q(q_id, s, pool[0], difficulty))
        q_id += 1

    # Pass 2: fill remaining budget
    budget = min(max_total, len(skills) * 3) - len(questions)
    for s in skills:
        if budget <= 0: break
        key  = s["skill"]
        pool = SKILLS_DB[key].get(difficulty, SKILLS_DB[key]["medium"])
        for q_text in pool[1:3]:
            if budget <= 0: break
            questions.append(_make_q(q_id, s, q_text, difficulty))
            q_id += 1
            budget -= 1

    return questions[:max_total]

def _make_q(q_id, skill_obj, q_text, difficulty):
    return {
        "id":           q_id,
        "skill":        skill_obj["skill"],
        "display_skill":skill_obj["display_name"],
        "category":     skill_obj["category"],
        "difficulty":   difficulty,
        "question":     q_text,
        "answer": "", "score": None, "feedback": "",
        "keywords_found": [], "keywords_missed": [],
    }
