from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
# 🔥 Language 모델을 사용하지 않으면 Flake8 오류 발생
from app.models.language import Language
from sqlalchemy.dialects.postgresql import JSONB  # ✅ JSONB 타입 추가

class StudyMaterials(Base):
    __tablename__ = "study_materials"

    material_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("languages.language_id"))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ✅ `sections` 필드 추가 (DB 변경 반영)
    sections = Column(JSONB, nullable=False, default=[])
    
    # ✅ Language 모델을 직접 사용하여 오류 해결
    language = relationship(Language, back_populates="materials")
