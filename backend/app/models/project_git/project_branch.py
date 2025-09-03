# backend/app/models/project_git/project_branch.py
from sqlalchemy import Integer, String, CHAR, Boolean, TIMESTAMP, text, UniqueConstraint, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ProjectBranch(Base):
    __tablename__ = "project_branches"

    branch_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_repo_id: Mapped[int] = mapped_column(ForeignKey("project_repos.project_repo_id", ondelete="CASCADE"), nullable=False)
    branch_name: Mapped[str] = mapped_column(String(120), nullable=False)
    head_sha: Mapped[str | None] = mapped_column(CHAR(40))
    is_protected: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        UniqueConstraint("project_repo_id", "branch_name"),
        Index("ix_ProjectBranches_repo_branch", "project_repo_id", "branch_name"),
    )

    repo = relationship("ProjectRepo", back_populates="branches")
