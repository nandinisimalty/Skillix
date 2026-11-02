from fastapi import APIRouter, HTTPException, status
from app.schemas.interview import (
    QuestionGenerationRequest, QuestionsResponse,
    AnswerEvaluationRequest, AnswerEvaluationResponse
)
from app.services.gemini_service import (
    GeminiConfigurationError,
    GeminiResponseError,
    GeminiRequestError,
    GeminiUnavailableError,
    gemini_service,
)
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
            topics=payload.topics,
            resume_context=payload.resume_context,
        )
        return res
    except GeminiConfigurationError as exc:
        logger.error("Gemini question generation configuration error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "gemini_configuration_error", "message": str(exc)},
        ) from exc
    except GeminiUnavailableError as exc:
        logger.error("Gemini question generation temporarily unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "gemini_temporarily_unavailable", "message": str(exc)},
        ) from exc
    except (GeminiResponseError, GeminiRequestError) as exc:
        logger.error("Gemini question generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "gemini_generation_failed", "message": str(exc)},
        ) from exc

@router.post("/evaluate-answer", response_model=AnswerEvaluationResponse)
async def evaluate_answer(payload: AnswerEvaluationRequest):
    try:
        res = gemini_service.evaluate_answer(
            target_role=payload.target_role,
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            question=payload.question,
            user_answer=payload.user_answer,
            topic=payload.topic,
        )
        return res
    except GeminiConfigurationError as exc:
        logger.error("Gemini answer evaluation configuration error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "gemini_configuration_error", "message": str(exc)},
        ) from exc
    except GeminiUnavailableError as exc:
        logger.error("Gemini answer evaluation temporarily unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "gemini_temporarily_unavailable", "message": str(exc)},
        ) from exc
    except (GeminiResponseError, GeminiRequestError) as exc:
        logger.error("Gemini answer evaluation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "gemini_evaluation_failed", "message": str(exc)},
        ) from exc
