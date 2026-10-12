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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
        "cors_origins": settings.CORS_ORIGINS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
