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
   python -m uvicorn app.main:app --reload --port 8001
   ```
   Access API docs at: `http://127.0.0.1:8001/docs`

The React frontend uses `VITE_BACKEND_URL=http://127.0.0.1:8001` in `frontend/.env`; do not put the Gemini API key in the frontend environment. Vite serves the app at `http://localhost:5176`. Restart Vite after changing frontend environment variables. The backend CORS configuration includes both localhost and loopback origins on ports 5176 and 5173, and keeps any additional origins configured by `CORS_ORIGINS`.

Set `GEMINI_API_KEY` in `backend/.env`. Interview generation and answer evaluation use `gemini-3.6-flash`, with `gemini-3.5-flash-lite` as the fallback. They return an error when Gemini is unavailable or does not return valid data; they do not substitute local AI scores or questions.

## Deploying the backend to Render

Create a Render Web Service with the repository root directory set to `backend`:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Configure `GEMINI_API_KEY` as a secret environment variable in Render. Set `CORS_ORIGINS` to a comma-separated list containing the exact Vercel deployment origin (for example, `https://your-app.vercel.app`). The backend retains localhost development origins by default. Render supplies `PORT`; the local Python entry point also uses `PORT` and binds to `0.0.0.0` by default.
