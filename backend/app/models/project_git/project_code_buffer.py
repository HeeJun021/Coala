# backend/app/models/project_git/project_code_buffer.py
from sqlalchemy import Integer, String, Text, CHAR, Boolean, TIMESTAMP, text, UniqueConstraint, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ProjectCodeBuffer(Base):
    __tablename__ = "project_code_buffers"

    buffer_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_repo_id: Mapped[int] = mapped_column(ForeignKey("project_repos.project_repo_id", ondelete="CASCADE"), nullable=False)
    branch_name: Mapped[str] = mapped_column(String(120), nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    content: Mapped[str | None] = mapped_column(Text)          # 편집본
    base_sha: Mapped[str | None] = mapped_column(CHAR(40))     # 기준점(브랜치 HEAD 또는 blob)
    change_type: Mapped[str | None] = mapped_column(String(1)) # 'A','M','D'
    is_staged: Mapped[bool] = mapped_column(Boolean, default=False)

    updated_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id", ondelete="SET NULL"))

    __table_args__ = (
        UniqueConstraint("project_repo_id", "branch_name", "path", "user_id"),
        Index("ix_Buffers_repo_branch_user", "project_repo_id", "branch_name", "user_id"),
        Index("ix_Buffers_repo_branch_path", "project_repo_id", "branch_name", "path"),
    )

    repo = relationship("ProjectRepo", back_populates="buffers")
