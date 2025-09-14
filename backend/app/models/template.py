from sqlalchemy import Column, Integer, String, JSON, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class NotionTemplate(Base):
    __tablename__ = "notion_templates"   # ✅ 기존 templates와 구분
    id = Column(Integer, primary_key=True)
    key = Column(String(120), unique=True, nullable=False)   # "portfolio-basic"
    title = Column(String(200), nullable=False)
    description = Column(Text)
    version = Column(Integer, nullable=False, default=1)
    doc_json = Column(JSON, nullable=False)                  # children 배열 스냅샷
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class NotionExportHistory(Base):
    __tablename__ = "notion_export_history"   # ✅ 기존 template_export_history와 구분
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)  # ✅ FK 연결
    template_id = Column(Integer, ForeignKey("notion_templates.id"), nullable=False)
    target_page_id = Column(String(100), nullable=False)   # 사용자가 공유한 Notion 페이지 ID
    created_page_id = Column(String(100), nullable=True)   # (DB에 생성된 경우)
    created_at = Column(DateTime, server_default=func.now())

    template = relationship("NotionTemplate")
