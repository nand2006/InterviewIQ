@echo off
echo ============================================
echo   InterviewIQ v4 — Starting Backend...
echo ============================================
cd backend
pip install flask flask-cors pdfminer.six python-docx scikit-learn numpy
python app.py
pause
