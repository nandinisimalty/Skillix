from pydantic import BaseModel, Field
from typing import List, Optional

class DailyGoal(BaseModel):
    day: str
    focus: str
    tasks: List[str]

class StudyPlanRequest(BaseModel):
    user_id: Optional[str] = None
    target_role: str = "Software Engineer"
    recent_interview_feedback: List[dict] = Field(default_factory=list)
    weak_topics: List[str] = Field(default_factory=list)

class StudyPlanResponse(BaseModel):
    target_role: str
    recommended_topics: List[str]
    daily_goals: List[DailyGoal]
    practice_questions: List[str]
    suggested_revision_activities: List[str]
    is_mock_response: bool = False
