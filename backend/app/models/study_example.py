from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.language import Language

class StudyExample(Base):
    __tablename__ = "study_example"

    example_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.language_id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    sections = Column(JSON, default=[])  # ✅ JSON 형식 필드 추가
    created_at = Column(DateTime, default=func.now(), server_default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), server_default=func.now())

    language = relationship("Language", back_populates="examples")
