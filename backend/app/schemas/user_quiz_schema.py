from typing import List, Optional
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime

# 문제 생성 스키마
class UserQuestionCreate(BaseModel):
    question_text: str
    choices: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    categories: Optional[str] = None
    question_type: int  # 1: OX, 2: 객관식, 3: 단답형

    @model_validator(mode="after")
    def validate_question(self):
        if not self.question_text.strip():
            raise ValueError("문제 내용은 필수입니다.")
        if not self.correct_answer.strip():
            raise ValueError("정답은 필수입니다.")

        if self.question_type == 1:
            if self.correct_answer not in ["O", "X"]:
                raise ValueError("OX 문제의 정답은 'O' 또는 'X'여야 합니다.")
        elif self.question_type == 2:
            if not self.choices or len(self.choices) < 2:
                raise ValueError("객관식은 선택지가 2개 이상 있어야 합니다.")
            if self.correct_answer not in self.choices:
                raise ValueError("객관식 문제의 정답은 선택지 안에 포함되어야 합니다.")
        elif self.question_type == 3:
            if self.choices:
                raise ValueError("단답형 문제는 선택지를 포함하지 않아야 합니다.")
        else:
            raise ValueError("문제 유형은 1(OX), 2(객관식), 3(단답형) 중 하나여야 합니다.")
        
        return self

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
    
class UserQuizHistoryItem(BaseModel):
    uq_submission_id: int
    userquiz_id: int
    title: str
    correct_count: int
    submitted_at: datetime
    creator_name: str

class UserQuizHistoryResponse(BaseModel):
    quizzes: List[UserQuizHistoryItem]