from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func  # 1. func 임포트
from app.database import Base
# from datetime import datetime # 2. datetime 임포트 제거

class ProjectDocument(Base):
    __tablename__ = "project_documents"

    doc_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False, default="새 문서")
    content = Column(Text, nullable=True, default="")

    # 3. DateTime(timezone=True)로 변경하고, DB의 now() 함수를 사용
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    project = relationship("Project", back_populates="documents")