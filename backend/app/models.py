from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from database import Base


# 학습자료 테이블
class StudyMaterials(Base):
    __tablename__ = "study_materials"

    material_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(String(50), nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    file_url = Column(Text, nullable=True)
    created_at = Column(
        TIMESTAMP, server_default=func.now()
    )
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )


# 예제 테이블
class StudyExample(Base):
    __tablename__ = "study_example"

    example_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(String(50), nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        TIMESTAMP, server_default=func.now()
    )
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )
