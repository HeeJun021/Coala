# backend/app/models/project_git/project_file_lock.py
from sqlalchemy import Integer, String, Text, TIMESTAMP, text, UniqueConstraint, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ProjectFileLock(Base):
    __tablename__ = "project_file_locks"

    lock_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_repo_id: Mapped[int] = mapped_column(ForeignKey("project_repos.project_repo_id", ondelete="CASCADE"), nullable=False)
    branch_name: Mapped[str] = mapped_column(String(120), nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    locked_by: Mapped[int] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    locked_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        UniqueConstraint("project_repo_id", "branch_name", "path"),
        Index("ix_FileLocks_repo_branch_path", "project_repo_id", "branch_name", "path"),
    )

    repo = relationship("ProjectRepo", back_populates="locks")
