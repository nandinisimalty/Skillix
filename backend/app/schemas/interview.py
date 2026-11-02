from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class QuestionGenerationRequest(BaseModel):
    target_role: str = Field(default="Software Engineer", min_length=1, max_length=120)
    interview_type: Literal["Technical", "HR", "Mixed"] = "Technical"
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    num_questions: int = Field(default=5, ge=1, le=10)
    topics: List[str] = Field(default_factory=list, max_length=20)
    resume_context: Optional[str] = Field(default=None, max_length=10000)

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
    target_role: str = Field(default="Software Engineer", min_length=1, max_length=120)
    interview_type: Literal["Technical", "HR", "Mixed"] = "Technical"
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    question: str = Field(min_length=1, max_length=3000)
    user_answer: str = Field(min_length=1, max_length=10000)
    topic: Optional[str] = None
    question_index: Optional[int] = 0

class AnswerEvaluationResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    max_score: int = Field(default=100, ge=1)
    percentage: float = Field(ge=0, le=100)
    verdict: Literal["Correct", "Mostly Correct", "Partially Correct", "Incorrect"]
    what_was_correct: List[str] = Field(default_factory=list)
    what_was_wrong: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    concept_explanation: str = Field(min_length=1)
    suggestions: List[str] = Field(min_length=1)
    explanation: str = Field(min_length=1)
    improved_answer: str = Field(min_length=1)
    is_mock_response: bool = False
