from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.schemas.question_schema import QuestionResponse, QuestionResult

class QuizBase(BaseModel):
    title: str
    quiz_type: str  # 'practice' 또는 'test'
    language_id: int

class QuizCreate(QuizBase):
    settings: List[dict]  # [{"question_type": 1, "difficulty": 1, "question_count": 5}, ...]

class QuizResponse(BaseModel):
    quiz_id: int
    title: str
    quiz_type: str
    language_id: int
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
    
#   퀴즈 결과 응답 스키마
class QuizResultResponse(BaseModel):
    quiz_id: int
    title: str
    quiz_type: str  # "practice" or "test"
    submitted_at: datetime
    rating_change: Optional[int] = 0  # 테스트 모드일 때만 적용
    questions: List[QuestionResult]
    
class IncorrectQuestionResponse(QuestionResponse):
    incorrect_attempts: int

    class Config:
        from_attributes = True  # ✅ v2에서는 이걸 사용
        
class CreateQuizFromQuestionsRequest(BaseModel):
    title: str
    quiz_type: str = "practice" # 오답 퀴즈는 'practice'로 고정하거나 선택 가능하게 할 수 있음
    language_id: int
    question_ids: List[int]

class RetakeQuizRequest(BaseModel):
    title: str = "My Retake Quiz"
    count: int = Field(..., gt=0, description="다시 풀어볼 문제의 개수 (0보다 커야 함)")
    language_id: int