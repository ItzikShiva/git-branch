from apscheduler.schedulers.background import BackgroundScheduler
from app.services.branch_service import sync_all_branches
from app.core.database import SessionLocal
from app.core.config import settings

def scheduled_sync():
    """
    Function to be executed by the scheduler.
    Creates a new DB session and calls the sync service.
    """
    db = SessionLocal()
    try:
        print("Scheduler running: Syncing all branches...")
        sync_all_branches(db)
        print("Scheduler: Sync finished.")
    finally:
        db.close()

scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(scheduled_sync, 'interval', hours=settings.SYNC_INTERVAL_HOURS) 