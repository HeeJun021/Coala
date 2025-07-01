from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
from app.models.language import Language
from app.models.exampleread_models import examplereads as examplereads  # ORM 클래스로 불러오기

class StudyExample(Base):
    __tablename__ = "study_example"

    example_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.language_id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)

    sections = Column(JSONB, nullable=False, default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    language = relationship("Language", back_populates="examples")
