from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Tasks(Base):
    __tablename__ = "Tasks"

    task_id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    due_date = Column(Date)
    status = Column(String(30), CheckConstraint("status IN ('예정', '진행중', '완료됨', '마감일 지남')"), default="예정")
    priority = Column(String(20), CheckConstraint("priority IN ('낮음', '보통', '높음')"), default="보통")
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())
    
    project = relationship("Project", back_populates="tasks")
    creator = relationship("User", backref="created_tasks")
    collaborators = relationship(
        "User",
        secondary="TaskCollaborators",
        backref="collaborated_tasks"
    )

class TaskCollaborators(Base):
    __tablename__ = "TaskCollaborators"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("Tasks.task_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)