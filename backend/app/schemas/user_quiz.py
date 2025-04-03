from typing import List, Optional
from pydantic import BaseModel

# 문제 생성 스키마
class UserQuestionCreate(BaseModel):
    question_text: str
    choices: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    categories: Optional[str] = None
    question_type: int  

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

# 퀴즈 상세 조회용
class UserQuestionDetail(BaseModel):
    userquestion_id: int
    question_text: str
    question_type: int  # 1: OX, 2: 객관식, 3: 단답형
    choices: Optional[List[str]] = None
    explanation: Optional[str] = None

class UserQuizDetail(BaseModel):
    userquiz_id: int
    title: str
    content: Optional[str]
    questions: List[UserQuestionDetail]

# 퀴즈 제출 요청
class UserQuizSubmitRequest(BaseModel):
    user_id: int
    userquiz_id: int
    answers: List[dict]  # { question_id: int, user_answer: str }

# 퀴즈 제출 응답
class UserQuizSubmitResponse(BaseModel):
    uq_submission_id: int
    correct_count: int
    total_count: int
    
class UserQuizResultQuestion(BaseModel):
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str
    question_type: int

class UserQuizResultResponse(BaseModel):
    userquiz_id: int
    title: str
    correct_count: int
    questions: List[UserQuizResultQuestion]