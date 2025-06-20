from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Branch as BranchModel, Repository
from app.schemas import BranchUpdate, RepositoryBranchesResponse, Branch as BranchSchema
from app.services.github_service import GitHubService
from app.services.branch_service import BranchService
import json

router = APIRouter()

@router.get("/branches/watched", response_model=List[BranchSchema])
async def get_watched_branches(db: Session = Depends(get_db)):
    """Get all watched branches"""
    watched_branches = db.query(BranchModel).filter(BranchModel.watched == True, BranchModel.archived == False).all()
    return watched_branches

@router.get("/branches", response_model=List[RepositoryBranchesResponse])
async def get_all_branches(db: Session = Depends(get_db)):
    """Get branches from all repositories"""
    repos = db.query(Repository).filter(Repository.is_active == True).all()
    result = []
    
    for repo in repos:
        branches = db.query(BranchModel).filter(BranchModel.repo_id == repo.id).all()
        result.append(RepositoryBranchesResponse(
            repo=repo.full_name,
            branches=branches
        ))
    
    return result

@router.get("/branches/{repo_id}", response_model=RepositoryBranchesResponse)
async def get_repository_branches(
    repo_id: int, 
    db: Session = Depends(get_db),
    refresh: bool = Query(False, description="Refresh data from GitHub")
):
    """Get branches for a specific repository"""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    if refresh:
        # Refresh branch data from GitHub
        try:
            branch_service = BranchService(db)
            await branch_service.sync_repository_branches(repo)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to refresh branches: {str(e)}"
            )
    
    branches = db.query(BranchModel).filter(BranchModel.repo_id == repo_id).all()
    
    return RepositoryBranchesResponse(
        repo=repo.full_name,
        branches=branches
    )

@router.put("/branches/{branch_id}", response_model=BranchSchema)
async def update_branch(
    branch_id: int,
    branch_update: BranchUpdate,
    db: Session = Depends(get_db)
):
    """Update branch metadata (notes, tags, status)"""
    branch = db.query(BranchModel).filter(BranchModel.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    update_data = branch_update.model_dump(exclude_unset=True)

    if 'tags' in update_data and update_data['tags'] is not None:
        update_data['tags'] = json.dumps(update_data['tags'])

    for key, value in update_data.items():
        setattr(branch, key, value)

    db.commit()
    db.refresh(branch)
    
    return branch

@router.post("/branches/{branch_id}/archive", response_model=BranchSchema)
async def archive_branch(branch_id: int, db: Session = Depends(get_db)):
    """Archive a branch"""
    branch = db.query(BranchModel).filter(BranchModel.id == branch_id).first()
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    branch.archived = True
    branch.status = "archived"
    db.commit()
    db.refresh(branch)
    
    return branch 