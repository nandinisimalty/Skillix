# Skillix Backend API (FastAPI)

FastAPI application providing AI Resume Analysis, AI Mock Interview Generation, Answer Evaluation, and Personalized Study Recommendations using Google Gemini API, PyMuPDF, and Firebase.

## Setup Instructions

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=8000
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. **Run Server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Access API docs at: `http://localhost:8000/docs`
