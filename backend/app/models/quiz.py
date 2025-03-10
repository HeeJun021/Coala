from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    quiz_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)  # 퀴즈 제목
    quiz_type = Column(String(20), nullable=False)  # 'practice' 또는 'test'
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Quiz와 연결된 QuizSetting 및 QuizAssignment
    settings = relationship("QuizSetting", back_populates="quiz")
    assignments = relationship("QuizAssignment", back_populates="quiz")

class QuizSetting(Base):
    __tablename__ = "quiz_settings"

    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"), primary_key=True)
    question_type = Column(Integer, ForeignKey("question_type.question_type"), primary_key=True)
    difficulty = Column(Integer, nullable=False)  # 난이도
    question_count = Column(Integer, nullable=False)  # 문제 개수

    quiz = relationship("Quiz", back_populates="settings")

class QuizAssignment(Base):
    __tablename__ = "quiz_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.question_id"), nullable=False)

    quiz = relationship("Quiz", back_populates="assignments")
    question = relationship("Question")
