from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import Repository
from app.schemas import RepositoryCreate, Repository as RepositorySchema
from app.services.github_service import GitHubService
from app.services.branch_service import BranchService

router = APIRouter()

@router.get("/repos", response_model=List[RepositorySchema])
async def get_repositories(db: Session = Depends(get_db)):
    """Get all tracked repositories"""
    repos = db.query(Repository).filter(Repository.is_active == True).all()
    return repos

@router.post("/repos", response_model=RepositorySchema, status_code=status.HTTP_201_CREATED)
async def create_repository(repo: RepositoryCreate, db: Session = Depends(get_db)):
    """Add a new repository to track"""
    # Check if repository already exists
    existing_repo = db.query(Repository).filter(Repository.full_name == repo.full_name).first()
    if existing_repo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository already exists"
        )
    
    # Validate repository exists on GitHub
    try:
        github_service = GitHubService(repo.github_token)
        repo_info = await github_service.get_repository(repo.owner, repo.name)
        if not repo_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found on GitHub"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to validate repository: {str(e)}"
        )
    
    # Create repository in database
    db_repo = Repository(
        name=repo.name,
        owner=repo.owner,
        full_name=repo.full_name,
        github_token=repo.github_token
    )
    db.add(db_repo)
    db.commit()
    db.refresh(db_repo)
    
    # Trigger initial branch sync
    try:
        branch_service = BranchService(db)
        await branch_service.sync_repository_branches(db_repo)
    except Exception as e:
        # This is not a critical failure, so we just log it or ignore it
        # The branches can be synced later manually or by the scheduler
        print(f"Failed to perform initial branch sync for {db_repo.full_name}: {e}")

    return db_repo

@router.get("/repos/{repo_id}", response_model=RepositorySchema)
async def get_repository(repo_id: int, db: Session = Depends(get_db)):
    """Get a specific repository by ID"""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    return repo

@router.delete("/repos/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_repository(repo_id: int, db: Session = Depends(get_db)):
    """Delete a repository (soft delete)"""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    repo.is_active = False
    db.commit()
    return None 