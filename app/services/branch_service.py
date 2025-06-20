from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
from app.models import Repository, Branch
from app.services.github_service import GitHubService

class BranchService:
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()
    
    async def sync_repository_branches(self, repo: Repository) -> bool:
        """Sync all branches for a repository from GitHub"""
        try:
            # Get branches from GitHub
            github_branches = await self.github_service.get_branches(repo.owner, repo.name)
            
            # Get existing branches from database
            existing_branches = {
                branch.branch_name: branch 
                for branch in self.db.query(Branch).filter(Branch.repo_id == repo.id).all()
            }
            
            # Process each branch from GitHub
            for github_branch in github_branches:
                branch_name = github_branch["name"]
                
                if branch_name in existing_branches:
                    # Update existing branch
                    await self._update_branch(existing_branches[branch_name], github_branch)
                else:
                    # Create new branch
                    await self._create_branch(repo, github_branch)
            
            # Mark branches that no longer exist as deleted
            github_branch_names = {branch["name"] for branch in github_branches}
            for branch_name, branch in existing_branches.items():
                if branch_name not in github_branch_names and branch.status != "deleted":
                    branch.status = "deleted"
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    async def _create_branch(self, repo: Repository, github_branch: dict) -> Branch:
        """Create a new branch in the database"""
        commit_data = github_branch["commit"]
        pr_data = github_branch.get("pr")
        
        branch = Branch(
            repo_id=repo.id,
            branch_name=github_branch["name"],
            last_commit_sha=commit_data["sha"],
            last_commit_date=datetime.fromisoformat(commit_data["date"].replace("Z", "+00:00")),
            last_commit_message=commit_data["message"],
            author=commit_data["author"],
            has_pr=pr_data is not None,
            pr_state=pr_data["state"] if pr_data else None,
            pr_url=pr_data["url"] if pr_data else None,
            status="active"
        )
        
        self.db.add(branch)
        return branch
    
    async def _update_branch(self, branch: Branch, github_branch: dict) -> None:
        """Update an existing branch with latest data from GitHub"""
        commit_data = github_branch["commit"]
        pr_data = github_branch.get("pr")
        
        # Update commit information
        branch.last_commit_sha = commit_data["sha"]
        branch.last_commit_date = datetime.fromisoformat(commit_data["date"].replace("Z", "+00:00"))
        branch.last_commit_message = commit_data["message"]
        branch.author = commit_data["author"]
        
        # Update PR information
        branch.has_pr = pr_data is not None
        if pr_data:
            branch.pr_state = pr_data["state"]
            branch.pr_url = pr_data["url"]
        else:
            branch.pr_state = None
            branch.pr_url = None
    
    async def sync_all_repositories(self) -> bool:
        """Sync branches for all active repositories"""
        repos = self.db.query(Repository).filter(Repository.is_active == True).all()
        
        for repo in repos:
            try:
                await self.sync_repository_branches(repo)
            except Exception as e:
                print(f"Failed to sync repository {repo.full_name}: {str(e)}")
                continue
        
        return True
    
    def get_branch_stats(self, repo_id: Optional[int] = None) -> dict:
        """Get statistics about branches"""
        query = self.db.query(Branch)
        
        if repo_id:
            query = query.filter(Branch.repo_id == repo_id)
        
        total_branches = query.count()
        active_branches = query.filter(Branch.status == "active").count()
        archived_branches = query.filter(Branch.archived == True).count()
        branches_with_pr = query.filter(Branch.has_pr == True).count()
        
        return {
            "total": total_branches,
            "active": active_branches,
            "archived": archived_branches,
            "with_pr": branches_with_pr
        }
    
    def get_stale_branches(self, days_threshold: int = 30) -> List[Branch]:
        """Get branches that haven't been updated in the specified number of days"""
        from datetime import timedelta
        
        threshold_date = datetime.now() - timedelta(days=days_threshold)
        
        return self.db.query(Branch).filter(
            Branch.last_commit_date < threshold_date,
            Branch.status == "active",
            Branch.archived == False
        ).all()
    
    def add_branch_tags(self, branch_id: int, tags: List[str]) -> bool:
        """Add tags to a branch"""
        branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            return False
        
        existing_tags = json.loads(branch.tags) if branch.tags else []
        new_tags = list(set(existing_tags + tags))  # Remove duplicates
        branch.tags = json.dumps(new_tags)
        
        self.db.commit()
        return True
    
    def remove_branch_tags(self, branch_id: int, tags: List[str]) -> bool:
        """Remove tags from a branch"""
        branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            return False
        
        existing_tags = json.loads(branch.tags) if branch.tags else []
        new_tags = [tag for tag in existing_tags if tag not in tags]
        branch.tags = json.dumps(new_tags)
        
        self.db.commit()
        return True 