from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class StudyMaterials(Base):
    __tablename__ = "study_materials"

    material_id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey("language.language_id"))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    language = relationship("Language", back_populates="materials")
