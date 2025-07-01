from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    func,
    Date,
    ForeignKey,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


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
    widget_order = Column(JSON, nullable=True)  # 위젯 순서 저장
    topic = Column(String(255), nullable=True)  #   주제(토픽)
    tech_stack = Column(JSON, nullable=True)  #   기술 스택

    members = relationship("ProjectMembers", back_populates="project")
    activity_logs = relationship("ProjectActivityLog", back_populates="project")
    widgets = relationship("ProjectWidgets", back_populates="project")
    erds = relationship("Erds", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Tasks", back_populates="project", cascade="all, delete-orphan")
    documents = relationship(  #   문서 다중 관계
        "ProjectDocument",
        back_populates="project",
        cascade="all, delete-orphan"
    )

class ProjectMembers(Base):
    __tablename__ = "projectmembers"

    member_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    is_leader = Column(Boolean, default=False)
    status = Column(String, default="pending")  #   여기 있음

    project = relationship("Project", back_populates="members")
    user = relationship("User")


class ProjectWidgets(Base):
    __tablename__ = "projectwidgets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    widget_type = Column(String, nullable=False)

    project = relationship("Project", back_populates="widgets")


class ProjectActivityLog(Base):
    __tablename__ = "projectactivitylogs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    actor_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    action = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="activity_logs")
    actor = relationship("User")
