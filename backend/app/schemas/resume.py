from pydantic import BaseModel, Field
from typing import List, Optional

class ResumeAnalysisRequest(BaseModel):
    user_id: Optional[str] = None
    target_role: Optional[str] = "Software Engineer"

class ResumeAnalysisResponse(BaseModel):
    detected_skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    possible_interview_questions: List[str] = Field(default_factory=list)
    summary: str = ""
    is_mock_response: bool = False
