from sqlalchemy import Column, Integer, String, JSON, Text, DateTime, func, ForeignKey, Boolean
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
    # ✅ 새로 추가된 컬럼 (노션 읽기 전용 링크)
    page_id = Column(String(64), nullable=True)
    preview_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class NotionExportHistory(Base):
    __tablename__ = "notion_export_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    template_id = Column(Integer, ForeignKey("notion_templates.id"), nullable=False)
    target_page_id = Column(String, nullable=False)
    created_page_id = Column(String, nullable=True)
    created_at = Column(Text, server_default=func.now())

    # ✅ 추가 필드들
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=True)
    ai_used = Column(Boolean, default=False, nullable=False)
    ai_prompt_len = Column(Integer, default=0, nullable=False)
    missing_keys = Column(JSON, default=list)             # 누락 키 목록
    extra_meta = Column(JSON, default=dict)               # 기타(성공/실패 메시지, 소요시간 등)

    user = relationship("User", backref="notion_export_histories")
    template = relationship("NotionTemplate", backref="export_histories")
