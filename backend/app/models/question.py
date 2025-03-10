from sqlalchemy import Column, Integer, String, Text, ARRAY, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base  # DB 연결을 위한 Base import

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
