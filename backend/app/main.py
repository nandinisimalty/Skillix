import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import resume, interviews, study_plan

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Skillix AI Interview Preparation API",
    description="Backend API powered by FastAPI, PyMuPDF, Firebase, and Google Gemini AI.",
    version="1.0.0"
)

# Configure CORS: support exact origins AND any local dev port via allow_origin_regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5178",
        "http://127.0.0.1:5178",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(resume.router)
app.include_router(interviews.router)
app.include_router(study_plan.router)

@app.get("/")
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "app": "Skillix AI Platform API",
        "gemini_key_configured": bool(settings.GEMINI_API_KEY),
        "cors_origins": [
            "http://localhost:5178",
            "http://127.0.0.1:5178",
            "http://localhost:5177",
            "http://127.0.0.1:5177",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
