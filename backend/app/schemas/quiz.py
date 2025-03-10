from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuizBase(BaseModel):
    title: str
    quiz_type: str  # 'practice' 또는 'test'

class QuizCreate(QuizBase):
    settings: List[dict]  # [{"question_type": 1, "difficulty": 1, "question_count": 5}, ...]

class QuizResponse(QuizBase):
    quiz_id: int
    created_at: datetime

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
