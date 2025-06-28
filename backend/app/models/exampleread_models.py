from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class examplereads(Base):
    __tablename__ = "examplereads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    example_id = Column(Integer, ForeignKey("study_example.example_id"))  # ✅ 정확한 테이블명
    read_at = Column(DateTime(timezone=True), server_default=func.now())
