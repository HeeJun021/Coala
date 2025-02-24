from sqlalchemy import Column, Integer, String
from app.database import Base


class StudyExample(Base):
    __tablename__ = "study_examples"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
