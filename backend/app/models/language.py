from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Language(Base):
    __tablename__ = "languages"

    language_id = Column(Integer, primary_key=True, index=True)
    language = Column(String, nullable=False, unique=True)

    # 🔥 StudyMaterials와 관계 설정
    materials = relationship("StudyMaterials", back_populates="language")
    examples = relationship("StudyExample", back_populates="language")
