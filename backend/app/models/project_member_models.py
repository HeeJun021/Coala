# backend/app/models/project_member.py
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ProjectMembers(Base):
    __tablename__ = "ProjectMembers"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("Projects.project_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.user_id"), nullable=False)
    is_leader = Column(Integer, default=0)

    project = relationship("Project", back_populates="members")
    user = relationship("Users")
    
    project = relationship("Project", back_populates="document")
