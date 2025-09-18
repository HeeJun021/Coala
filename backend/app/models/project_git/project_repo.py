# backend/app/models/project_git/project_repo.py
from sqlalchemy import Integer, String, BigInteger, TIMESTAMP, text, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ProjectRepo(Base):
    __tablename__ = "project_repos"

    project_repo_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default="github")
    owner: Mapped[str] = mapped_column(String(100), nullable=False)
    repo_name: Mapped[str] = mapped_column(String(200), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), nullable=False, default="main")
    installation_id: Mapped[int | None] = mapped_column(BigInteger)
    last_synced_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    owner_user = relationship("User", lazy="joined", foreign_keys=[owner_user_id])
    
    __table_args__ = (
        UniqueConstraint("project_id", "provider", "owner", "repo_name"),
    )

    branches = relationship("ProjectBranch", back_populates="repo", cascade="all, delete-orphan")
    buffers  = relationship("ProjectCodeBuffer", back_populates="repo", cascade="all, delete-orphan")
    locks    = relationship("ProjectFileLock", back_populates="repo", cascade="all, delete-orphan")
