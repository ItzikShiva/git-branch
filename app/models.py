from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    owner = Column(String, index=True)
    full_name = Column(String, unique=True, index=True)
    github_token = Column(Text, nullable=True)  # Encrypted in production
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    branches = relationship("Branch", back_populates="repository", cascade="all, delete-orphan")

class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"))
    branch_name = Column(String, index=True)
    status = Column(String, default="active")  # active, archived, deleted
    last_commit_sha = Column(String)
    last_commit_date = Column(DateTime(timezone=True))
    last_commit_message = Column(String)
    author = Column(String)
    has_pr = Column(Boolean, default=False)
    pr_state = Column(String, nullable=True)  # open, closed, merged, draft
    pr_url = Column(String, nullable=True)
    tags = Column(String, default="[]")
    notes = Column(String, nullable=True)
    archived = Column(Boolean, default=False)
    watched = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    repository = relationship("Repository", back_populates="branches")
    
    class Config:
        orm_mode = True 