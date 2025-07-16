from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Language(Base):
    __tablename__ = "languages"

    language_id = Column(Integer, primary_key=True, autoincrement=True)
    language = Column(String, unique=True, nullable=False)

    materials = relationship("StudyMaterials", back_populates="language", cascade="all, delete-orphan")
    examples = relationship("StudyExample", back_populates="language", cascade="all, delete-orphan")