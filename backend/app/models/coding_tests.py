from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CodingTests(Base):
    """코딩 테스트 문제 테이블"""
    __tablename__ = "codingtests"

    source_id = Column(Integer, primary_key=True)  # ✅ test_id 제거하고 source_id를 PK로 변경
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)  # ✅ NULL 허용으로 변경
    level = Column(Integer, nullable=True)  # 난이도 NULL 허용
    category = Column(String(100), nullable=True)
    starter_code = Column(Text, nullable=True)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    time_limit = Column(Integer, nullable=False, default=2)
    memory_limit = Column(Integer, nullable=False, default=256)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # ✅ 관계 설정
    examples = relationship("CodingTestExamples", back_populates="coding_test", cascade="all, delete")
    constraints = relationship("CodingTestConstraints", back_populates="coding_test", cascade="all, delete")
    test_cases = relationship("CodingTestTestCases", back_populates="coding_test", cascade="all, delete")


class CodingTestExamples(Base):
    """코딩 테스트 예제 테이블"""
    __tablename__ = "codingtestexamples"

    example_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("codingtests.source_id", ondelete="CASCADE"))
    example_input = Column(Text, nullable=False)
    example_output = Column(Text, nullable=False)
    example_explanation = Column(Text, nullable=True)

    coding_test = relationship("CodingTests", back_populates="examples")


class CodingTestConstraints(Base):
    """코딩 테스트 제한 사항 테이블"""
    __tablename__ = "codingtestconstraints"

    constraint_id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("codingtests.source_id", ondelete="CASCADE"))
    constraint_text = Column(Text, nullable=False)

    coding_test = relationship("CodingTests", back_populates="constraints")


class CodingTestTestCases(Base):
    """코딩 테스트 케이스 구성 안내 테이블"""
    __tablename__ = "codingtesttestcases"

    test_case_id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("codingtests.source_id", ondelete="CASCADE"))
    test_group = Column(String(50), nullable=False)
    score = Column(String(10), nullable=True)
    description = Column(Text, nullable=False)

    coding_test = relationship("CodingTests", back_populates="test_cases")
