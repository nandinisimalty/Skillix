from fastapi import APIRouter, HTTPException, status
from app.schemas.interview import (
    QuestionGenerationRequest, QuestionsResponse,
    AnswerEvaluationRequest, AnswerEvaluationResponse
)
from app.services.gemini_service import gemini_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/interviews", tags=["Interviews"])

@router.post("/generate-questions", response_model=QuestionsResponse)
async def generate_questions(payload: QuestionGenerationRequest):
    try:
        res = gemini_service.generate_interview_questions(
            target_role=payload.target_role,
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            num_questions=payload.num_questions,
            topics=payload.topics
        )
        return res
    except Exception as e:
        logger.error(f"Error generating interview questions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {str(e)}"
        )

@router.post("/evaluate-answer", response_model=AnswerEvaluationResponse)
async def evaluate_answer(payload: AnswerEvaluationRequest):
    try:
        res = gemini_service.evaluate_answer(
            target_role=payload.target_role,
            interview_type=payload.interview_type,
            question=payload.question,
            user_answer=payload.user_answer
        )
        return res
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate answer: {str(e)}"
        )
