from sqlalchemy import Column, Integer, String, Text, Float, Date, func, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

# ✅ 프로젝트 테이블
class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    duration = Column(Integer, nullable=True)
    progress = Column(Float, default=0.0)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    members = relationship("ProjectMembers", back_populates="project")
    activity_logs = relationship("ProjectActivityLog", back_populates="project")
    widgets = relationship("ProjectWidgets", back_populates="project")
    erds = relationship("Erds", back_populates="project", cascade="all, delete-orphan")

    # ✅ 문서와의 1:1 관계
    # 기존 document (1:1) 제거 후 아래 추가:
    documents = relationship(
        "ProjectDocument",
        back_populates="project",
        cascade="all, delete-orphan"
    )

# ✅ 프로젝트 멤버 테이블
class ProjectMembers(Base):
    __tablename__ = "projectmembers"

    member_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    is_leader = Column(Boolean, default=False)

    project = relationship("Project", back_populates="members")
    user = relationship("User")  # 유저 모델은 외부에서 정의됨

# ✅ 프로젝트 위젯 테이블
class ProjectWidgets(Base):
    __tablename__ = "projectwidgets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    widget_type = Column(String, nullable=False)

    project = relationship("Project", back_populates="widgets")

# ✅ 프로젝트 활동 로그 테이블
class ProjectActivityLog(Base):
    __tablename__ = "projectactivitylogs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    actor_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    action = Column(Text, nullable=False)
    created_at = Column(Date, server_default=func.now())

    project = relationship("Project", back_populates="activity_logs")
    actor = relationship("User")
