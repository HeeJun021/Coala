from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

# ✅ 코딩 테스트 문제 테이블
class CodingTests(Base):
    __tablename__ = "coding_tests"

    test_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(Integer, nullable=False)
    category = Column(String(100), nullable=True)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    time_limit = Column(Integer, nullable=False, default=2000)
    memory_limit = Column(Integer, nullable=False, default=256)
    created_at = Column(Integer, nullable=False, default=2000)

    # 관계 설정
    test_cases = relationship("CodingTestCases", back_populates="test")
    constraints = relationship("CodingTestConstraints", back_populates="test")

# ✅ 테스트 케이스 저장 테이블
class CodingTestCases(Base):
    __tablename__ = "coding_test_cases"

    test_case_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("coding_tests.test_id", ondelete="CASCADE"))
    test_type = Column(String(20), nullable=False)  # 'basic', 'boundary', 'hidden'
    example_input = Column(Text, nullable=False)
    example_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False)

    # 관계 설정
    test = relationship("CodingTests", back_populates="test_cases")

# ✅ 입력값 제약 조건 테이블
class CodingTestConstraints(Base):
    __tablename__ = "coding_test_constraints"

    constraint_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("coding_tests.test_id", ondelete="CASCADE"))
    variable_name = Column(String(50), nullable=False)
    min_value = Column(Integer, nullable=True)
    max_value = Column(Integer, nullable=True)
    constraint_text = Column(Text, nullable=False)

    # 관계 설정
    test = relationship("CodingTests", back_populates="constraints")
