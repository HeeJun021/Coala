from sqlalchemy import Column, Integer, String, Text, ARRAY, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base  # DB 연결을 위한 Base import

class QuestionType(Base):  # ✅ `question_type` 테이블 정의
    __tablename__ = "question_type"

    question_type = Column(Integer, primary_key=True)  # OX, 단답형, 객관식
    base_score = Column(Integer, nullable=False)  # 기본 점수

class Question(Base):
    __tablename__ = "questions"

    question_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question_text = Column(Text, nullable=False)  # 문제 내용
    choices = Column(ARRAY(String), nullable=True)  # 객관식 선택지 (OX, 객관식만 해당)
    question_type = Column(Integer, ForeignKey("question_type.question_type"), nullable=False)  # 문제 유형 (1=OX, 2=객관식, 3=단답형)
    difficulty = Column(Integer, nullable=False)  # 난이도 (1=쉬움, 2=보통, 3=어려움)
    correct_answer = Column(Text, nullable=False)  # 정답
    explanation = Column(Text, nullable=True)  # 해설
    created_at = Column(TIMESTAMP, server_default=func.now())  # 생성 시간
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())  # 수정 시간

    # ✅ QuizSubmissionDetails에서 사용할 관계 설정 (quiz.py에서 참조 가능하도록 추가)
    submission_details = relationship("QuizSubmissionDetails", back_populates="question")
