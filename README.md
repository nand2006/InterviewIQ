# InterviewIQ v4 🎯
### AI-Based Resume-Driven Interview Practice System

---

## What's New in v4

| Fix | Details |
|-----|---------|
| ✅ Scoring Fixed | Expert answers now score 70-85%. Uses keyword (50pts) + TF-IDF (30pts) + length (20pts) |
| ✅ Difficulty Selector | Choose Easy / Medium / Hard before starting |
| ✅ AI Adaptive Mode | System auto-adjusts difficulty based on live performance |
| ✅ Mic Fixed | Chrome Speech API with continuous=true, isFinal only — no pronunciation errors |
| ✅ Dark UI | Professional dark theme — not AI-generated looking |
| ✅ Rich Report | 6 personalized recommendations based on your weak areas |

---

## AI Concepts Used

1. **TF-IDF Vectorization** — converts answers to weighted term vectors
2. **Cosine Similarity** — measures semantic closeness to ideal answer
3. **Naive Bayes Classifier** — classifies answer quality (Poor/Average/Good/Excellent)
4. **Adaptive Difficulty Engine** — adjusts question level based on live performance
5. **Confidence Score Predictor** — 5-feature weighted ML model for readiness score

---

## How to Run

### Step 1 — Backend (Terminal 1)
```
Double-click: start_backend.bat
```
OR manually:
```cmd
cd backend
pip install flask flask-cors pdfminer.six python-docx scikit-learn numpy
python app.py
```
Wait for: `http://localhost:5000`

### Step 2 — Frontend (Terminal 2)
```
Double-click: start_frontend.bat
```
OR manually:
```cmd
cd frontend
npm install
npm run dev
```
Wait for: `http://localhost:3000`

### Step 3 — Open Browser
Go to: **http://localhost:3000**

---

## Resume Entry for Your CV

**Tech Stack:** Python, Flask, React.js, scikit-learn, TF-IDF, Naive Bayes, REST API, pdfminer

- Developed an AI-powered platform that parses PDF/DOCX resumes using pdfminer and detects skills via NLP-based keyword extraction.
- Implemented TF-IDF Vectorization and Cosine Similarity using scikit-learn to semantically score user answers, and a Naive Bayes classifier to grade response quality with confidence scores.
- Built an Adaptive Difficulty Engine that dynamically adjusts interview question difficulty based on the candidate's real-time performance scores.
- Designed a Flask REST API backend with React.js frontend supporting resume upload, skill extraction, question generation, answer evaluation, and a detailed AI performance report.
