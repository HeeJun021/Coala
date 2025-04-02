from typing import List, Optional
from pydantic import BaseModel

# 문제 생성 스키마
class UserQuestionCreate(BaseModel):
    question_text: str
    choices: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    categories: Optional[str] = None

# 퀴즈 생성 요청 스키마
class UserQuizCreate(BaseModel):
    user_id: int  # 프론트에서 전달받음
    title: str
    content: Optional[str] = None
    questions: List[UserQuestionCreate]

# 퀴즈 생성 응답 스키마
class UserQuizCreateResponse(BaseModel):
    userquiz_id: int
    question_ids: List[int]
