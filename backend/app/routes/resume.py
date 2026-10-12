from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
import logging
from app.services.resume_service import ResumeService
from app.services.gemini_service import gemini_service
from app.schemas.resume import ResumeAnalysisResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/resume", tags=["Resume"])

@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form("Software Engineer"),
    user_id: Optional[str] = Form(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF resumes are accepted."
        )

    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024: # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum 10MB limit."
            )

        extracted_text = ResumeService.extract_text_from_pdf_bytes(contents)
        analysis_result = gemini_service.analyze_resume(extracted_text, target_role)
        return analysis_result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error processing resume upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the resume: {str(e)}"
        )
