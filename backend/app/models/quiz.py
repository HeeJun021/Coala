from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    quiz_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    quiz_type = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    settings = relationship("QuizSetting", back_populates="quiz")
    assignments = relationship("QuizAssignment", back_populates="quiz")

class QuizSetting(Base):
    __tablename__ = "quizsetting"

    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"), primary_key=True)
    question_type = Column(Integer, ForeignKey("question_type.question_type"), primary_key=True)  # ✅ FK 수정
    difficulty = Column(Integer, nullable=False)
    question_count = Column(Integer, nullable=False)

    quiz = relationship("Quiz", back_populates="settings")
    question_type_rel = relationship("QuestionType")  # ✅ FK 관계 추가

class QuizAssignment(Base):
    __tablename__ = "quizassignment"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.question_id"), nullable=False)

    quiz = relationship("Quiz", back_populates="assignments")
    question = relationship("Question")
