from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.question_schema import QuestionResponse, QuestionResult

class QuizBase(BaseModel):
    title: str
    quiz_type: str  # 'practice' 또는 'test'

class QuizCreate(QuizBase):
    settings: List[dict]  # [{"question_type": 1, "difficulty": 1, "question_count": 5}, ...]

class QuizResponse(BaseModel):
    quiz_id: int
    title: str
    quiz_type: str
    created_at: datetime
    questions: Optional[List[QuestionResponse]] = []

    class Config:
        from_attributes = True

class QuizSettingBase(BaseModel):
    question_type: int
    difficulty: int
    question_count: int

class QuizSettingResponse(QuizSettingBase):
    quiz_id: int

    class Config:
        from_attributes = True

class QuizAssignmentResponse(BaseModel):
    quiz_id: int
    question_id: int

    class Config:
        from_attributes = True

class QuizAnswer(BaseModel):
    question_id: int
    user_answer: str

class QuizSubmissionRequest(BaseModel):
    quiz_id: int
    user_id: int
    mode: str
    answers: List[QuizAnswer]
    
# ✅ 퀴즈 결과 응답 스키마
class QuizResultResponse(BaseModel):
    quiz_id: int
    title: str
    quiz_type: str  # "practice" or "test"
    submitted_at: datetime
    rating_change: Optional[int] = 0  # 테스트 모드일 때만 적용
    questions: List[QuestionResult]