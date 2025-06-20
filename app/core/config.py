from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./gitstatus.db"
    
    # GitHub API
    github_token: Optional[str] = None
    github_api_base_url: str = "https://api.github.com"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # App settings
    app_name: str = "GitStatus Branch Management System"
    debug: bool = True
    
    # Sync settings
    sync_interval_hours: int = 6
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings() 