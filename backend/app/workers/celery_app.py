from celery import Celery
from app.core.config import settings

# Initialize Celery
celery_app = Celery(
    "civicfix_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Optional configuration for the prototype
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
)

if __name__ == "__main__":
    celery_app.start()