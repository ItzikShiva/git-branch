from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import repos, branches
from app.core.config import settings
from app.core.database import engine, Base
# from app.scheduler import scheduler

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GitStatus Branch Management System",
    description="A comprehensive system for managing and tracking Git branches across repositories",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    "http://localhost",
    "http://localhost:3000",
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.on_event("startup")
# def startup_event():
#     scheduler.start()

# @app.on_event("shutdown")
# def shutdown_event():
#     scheduler.shutdown()

# Include routers
app.include_router(repos.router, prefix="/api/v1", tags=["repositories"])
app.include_router(branches.router, prefix="/api/v1", tags=["branches"])

@app.get("/")
async def root():
    return {
        "message": "GitStatus Branch Management System",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 