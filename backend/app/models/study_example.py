from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
# 🔥 Language 모델을 사용하지 않으면 Flake8 오류 발생
from app.models.language import Language


class StudyExample(Base):
    __tablename__ = "study_example"

    example_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.language_id"))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ✅ Language 모델을 직접 사용하여 오류 해결
    language = relationship(Language, back_populates="examples")
