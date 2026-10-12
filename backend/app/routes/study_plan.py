from fastapi import APIRouter, HTTPException, status
from app.schemas.study_plan import StudyPlanRequest, StudyPlanResponse
from app.services.gemini_service import gemini_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/study-plan", tags=["Study Plan"])

@router.post("/generate", response_model=StudyPlanResponse)
async def generate_study_plan(payload: StudyPlanRequest):
    try:
        res = gemini_service.generate_study_plan(
            target_role=payload.target_role,
            weak_topics=payload.weak_topics,
            recent_feedback=payload.recent_interview_feedback
        )
        return res
    except Exception as e:
        logger.error(f"Error generating study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )
