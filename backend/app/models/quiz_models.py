from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Boolean, Text
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
    question_type = Column(Integer, ForeignKey("question_type.question_type"), primary_key=True)  # FK 수정
    difficulty = Column(Integer, nullable=False)
    question_count = Column(Integer, nullable=False)

    quiz = relationship("Quiz", back_populates="settings")
    question_type_rel = relationship("QuestionType")  # FK 관계 추가

class QuizAssignment(Base):
    __tablename__ = "quizassignment"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.question_id"), nullable=False)

    quiz = relationship("Quiz", back_populates="assignments")
    question = relationship("Question")  # "Questions" → "Question"

# 퀴즈 제출 정보 테이블
class QuizSubmissions(Base):
    __tablename__ = "quizsubmissions"  # 테이블명 확인

    submission_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    rating_change = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    submitted_at = Column(TIMESTAMP, server_default=func.now())

    # QuizSubmissionDetails와 관계 설정
    details = relationship(
        "QuizSubmissionDetails",
        back_populates="submission",
        cascade="all, delete-orphan"
    )


# 개별 문제 제출 정보 테이블
class QuizSubmissionDetails(Base):
    __tablename__ = "quizsubmissiondetails"  # 테이블명 확인

    detail_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("quizsubmissions.submission_id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.question_id", ondelete="CASCADE"), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)

    # QuizSubmissions과 연결 (부모 테이블)
    submission = relationship(
        "QuizSubmissions",
        back_populates="details"
    )

    # Question과 연결 (제출된 문제 정보)
    question = relationship(
        "Question",
        back_populates="submission_details"
    )