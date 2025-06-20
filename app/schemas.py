from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List
from datetime import datetime
import json

# Repository schemas
class RepositoryBase(BaseModel):
    name: str
    owner: str
    full_name: str

class RepositoryCreate(RepositoryBase):
    github_token: Optional[str] = None

class Repository(RepositoryBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Branch schemas
class BranchBase(BaseModel):
    branch_name: str
    status: str = "active"
    last_commit_sha: Optional[str] = None
    last_commit_date: Optional[datetime] = None
    last_commit_message: Optional[str] = None
    author: Optional[str] = None
    has_pr: bool = False
    pr_state: Optional[str] = None
    pr_url: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None
    archived: bool = False

    @field_validator('tags', mode='before')
    @classmethod
    def tags_from_json_string(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        if v is None:
            return []
        return v

class BranchCreate(BranchBase):
    repo_id: int

class BranchUpdate(BaseModel):
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    archived: Optional[bool] = None

class Branch(BranchBase):
    id: int
    repo_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# API Response schemas
class RepositoryBranchesResponse(BaseModel):
    repo: str
    branches: List[Branch]

# Error schemas
class ErrorResponse(BaseModel):
    detail: str 