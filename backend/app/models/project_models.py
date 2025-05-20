# backend/app/models/project_models.py
from sqlalchemy import Column, Integer, String, Text, Float, Date, func, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Project(Base):
    __tablename__ = "Projects"

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

class ProjectMembers(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("Projects.project_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    is_leader = Column(Boolean, default=False)

    project = relationship("Project", back_populates="members")
    user = relationship("User")

class ProjectWidgets(Base):
    __tablename__ = "project_widgets"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("Projects.project_id"))
    widget_type = Column(String)  # 예: 'ERD', 'GIT', 'MEMO', 'CALENDAR'

class ProjectActivityLog(Base):
    __tablename__ = "project_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("Projects.project_id"))
    actor_id = Column(Integer, ForeignKey("users.user_id"))
    action = Column(Text, nullable=False)
    created_at = Column(Date, server_default=func.now())

    project = relationship("Project", back_populates="activity_logs")
    actor = relationship("User")