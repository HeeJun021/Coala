from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, TIMESTAMP, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func

class CodingTests(Base):
    __tablename__ = "codingtests"

    test_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(Integer, nullable=False)
    category = Column(String(100), nullable=True)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    time_limit = Column(Integer, nullable=False)
    memory_limit = Column(Integer, nullable=False, default=256)
    created_at = Column(TIMESTAMP, nullable=True)

    test_cases = relationship("CodingTestCases", back_populates="test", cascade="all, delete")
    constraints = relationship("CodingTestConstraints", back_populates="test", cascade="all, delete")


class CodingTestCases(Base):
    __tablename__ = "codingtestcases"

    test_case_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("codingtests.test_id", ondelete="CASCADE"))
    test_type = Column(String(20), nullable=False)
    example_input = Column(Text, nullable=False)
    example_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False)

    test = relationship("CodingTests", back_populates="test_cases")


class CodingTestConstraints(Base):
    __tablename__ = "codingtestconstraints"

    constraint_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("codingtests.test_id", ondelete="CASCADE"))
    variable_name = Column(String(50), nullable=False)
    min_value = Column(Integer, nullable=True)
    max_value = Column(Integer, nullable=True)
    constraint_text = Column(Text, nullable=False)

    test = relationship("CodingTests", back_populates="constraints")

class problemstartercode(Base):
    __tablename__ = "problemstartercode"

    starter_code_id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("codingtests.test_id", ondelete="CASCADE"), nullable=False)
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('test_id', 'language', name='uix_test_language'),)


class CodingTestSubmissions(Base):
    __tablename__ = "codingtestsubmissions"

    ct_submission_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("codingtests.test_id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    title = Column(String(255), nullable=True)
    code = Column(Text, nullable=False)
    execution_log = Column(Text, nullable=True)
    passed_test_cases = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    is_correct = Column(Boolean, default=False)
    submitted_at = Column(TIMESTAMP, nullable=True)
    language = Column(String(20), default="python")
    viewed_others = Column(Boolean, default=False)


class CorrectSubmissionStats(Base):
    __tablename__ = "correctsubmissionstats"

    test_id = Column(Integer, ForeignKey("codingtests.test_id", ondelete="CASCADE"), primary_key=True)
    total_submissions = Column(Integer, default=0)
    correct_submissions = Column(Integer, default=0)
    correct_rate = Column(Float, default=0.0)


class WrongNote(Base):
    __tablename__ = "wrongnote"

    note_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    ct_submission_id = Column(Integer, ForeignKey("codingtestsubmissions.ct_submission_id", ondelete="CASCADE"))
    submitted_answer = Column(Text, nullable=False)
    execution_result = Column(Text, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=True)
