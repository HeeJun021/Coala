# app/models/templates_models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, func, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class TemplateLibrary(Base):
    __tablename__ = "template_library"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    tags = Column(JSON, nullable=True)        
    blocks = Column(JSON, nullable=False)      
    thumbnail_url = Column(String(255), nullable=True)
    version = Column(Integer, default=1)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ProjectTemplate(Base):
    __tablename__ = "project_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    widgets = Column(JSON, nullable=True)      
    applied_blocks = Column(JSON, nullable=True)   
    library_id = Column(Integer, ForeignKey("template_library.id", ondelete="SET NULL"), nullable=True)
    added_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="templates")
