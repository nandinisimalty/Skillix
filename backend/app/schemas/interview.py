from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionGenerationRequest(BaseModel):
    target_role: str = "Software Engineer"
    interview_type: str = "Technical" # Technical, HR, Mixed
    difficulty: str = "Medium" # Easy, Medium, Hard
    num_questions: int = 5
    topics: List[str] = Field(default_factory=list)
    resume_context: Optional[str] = None

class QuestionItem(BaseModel):
    id: int
    question: str
    category: str
    difficulty: str
    hints: Optional[List[str]] = Field(default_factory=list)

class QuestionsResponse(BaseModel):
    target_role: str
    interview_type: str
    difficulty: str
    questions: List[QuestionItem]
    is_mock_response: bool = False

class AnswerEvaluationRequest(BaseModel):
    target_role: str = "Software Engineer"
    interview_type: str = "Technical"
    question: str
    user_answer: str
    topic: Optional[str] = None
    question_index: Optional[int] = 0

class AnswerEvaluationResponse(BaseModel):
    score: int = Field(ge=0, le=100)          # 0-100
    verdict: str                               # e.g. "Correct", "Mostly Correct", "Partially Correct", "Incorrect"
    what_was_correct: List[str] = Field(default_factory=list)
    what_was_wrong: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    explanation: str = ""
    improved_answer: str = ""
    is_mock_response: bool = False
