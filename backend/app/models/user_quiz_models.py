from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, ARRAY
from app.database import Base


class Userquizzes(Base):
    __tablename__ = "userquizzes"

    userquiz_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")


class Userquestions(Base):
    __tablename__ = "userquestions"

    userquestion_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    choices = Column(ARRAY(Text), nullable=True)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    categories = Column(String(100), nullable=True)
    question_type = Column(Integer, nullable=False)  #  (1: OX, 2: 객관식, 3: 단답형)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")


class Userquizassignments(Base):
    __tablename__ = "userquizassignments"

    userquiz_id = Column(Integer, ForeignKey("userquizzes.userquiz_id", ondelete="CASCADE"), primary_key=True)
    seq = Column(Integer, primary_key=True)
    userquestion_id = Column(Integer, ForeignKey("userquestions.userquestion_id", ondelete="CASCADE"), nullable=False)
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")


class Userquizsubmissions(Base):
    __tablename__ = "userquizsubmissions"

    uq_submission_id = Column(Integer, primary_key=True, index=True)
    userquiz_id = Column(Integer, ForeignKey("userquizzes.userquiz_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    correct_count = Column(Integer, default=0)
    submitted_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")


class Userquizsubmissiondetails(Base):
    __tablename__ = "userquizsubmissiondetails"

    uq_submission_id = Column(Integer, ForeignKey("userquizsubmissions.uq_submission_id", ondelete="CASCADE"), primary_key=True)
    seq = Column(Integer, primary_key=True)
    question_text = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
