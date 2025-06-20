import aiohttp
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.config import settings

class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.github_token
        self.base_url = settings.github_api_base_url
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitStatus-Branch-Management"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"
    
    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """Get repository information from GitHub"""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    return await response.json()
                return None
    
    async def get_branches(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Get all branches for a repository"""
        url = f"{self.base_url}/repos/{owner}/{repo}/branches"
        branches = []
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    branches_data = await response.json()
                    
                    # Get detailed information for each branch
                    for branch_data in branches_data:
                        branch_info = await self._get_branch_details(owner, repo, branch_data["name"])
                        if branch_info:
                            branches.append(branch_info)
                
                return branches
    
    async def _get_branch_details(self, owner: str, repo: str, branch_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific branch"""
        url = f"{self.base_url}/repos/{owner}/{repo}/branches/{branch_name}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    branch_data = await response.json()
                    
                    # Get PR information for this branch
                    pr_info = await self._get_pull_request(owner, repo, branch_name)
                    
                    return {
                        "name": branch_name,
                        "commit": {
                            "sha": branch_data["commit"]["sha"],
                            "date": branch_data["commit"]["commit"]["author"]["date"],
                            "message": branch_data["commit"]["commit"]["message"],
                            "author": branch_data["commit"]["commit"]["author"]["name"]
                        },
                        "pr": pr_info
                    }
                return None
    
    async def _get_pull_request(self, owner: str, repo: str, branch_name: str) -> Optional[Dict[str, Any]]:
        """Get pull request information for a branch"""
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
        params = {"head": f"{owner}:{branch_name}"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers, params=params) as response:
                if response.status == 200:
                    prs = await response.json()
                    if prs:
                        pr = prs[0]  # Get the first PR for this branch
                        return {
                            "state": pr["state"],
                            "url": pr["html_url"],
                            "title": pr["title"],
                            "draft": pr.get("draft", False),
                            "merged": pr.get("merged", False),
                            "mergeable": pr.get("mergeable"),
                            "mergeable_state": pr.get("mergeable_state")
                        }
                return None
    
    async def get_commit_details(self, owner: str, repo: str, sha: str) -> Optional[Dict[str, Any]]:
        """Get detailed commit information"""
        url = f"{self.base_url}/repos/{owner}/{repo}/commits/{sha}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    commit_data = await response.json()
                    return {
                        "sha": commit_data["sha"],
                        "message": commit_data["commit"]["message"],
                        "author": {
                            "name": commit_data["commit"]["author"]["name"],
                            "email": commit_data["commit"]["author"]["email"],
                            "date": commit_data["commit"]["author"]["date"]
                        },
                        "committer": {
                            "name": commit_data["commit"]["committer"]["name"],
                            "email": commit_data["commit"]["committer"]["email"],
                            "date": commit_data["commit"]["committer"]["date"]
                        }
                    }
                return None
    
    async def test_connection(self) -> bool:
        """Test GitHub API connection"""
        url = f"{self.base_url}/user"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                return response.status == 200 