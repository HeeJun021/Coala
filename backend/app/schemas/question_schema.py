from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuestionBase(BaseModel):
    question_text: str
    question_type: int  # 1=OX, 2=객관식, 3=단답형
    difficulty: int  # 1=쉬움, 2=보통, 3=어려움
    correct_answer: str
    explanation: Optional[str] = None
    language_id: int 

class QuestionCreate(QuestionBase):
    choices: Optional[List[str]] = None  # 객관식 & OX 문제만 선택지가 존재

class QuestionResponse(QuestionBase):
    question_id: int
    choices: Optional[List[str]] = None
    language_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
#   개별 문제 결과 스키마
class QuestionResult(BaseModel):
    question_id: int
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None