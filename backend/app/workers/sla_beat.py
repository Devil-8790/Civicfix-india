from celery.schedules import crontab
from app.workers.celery_app import celery_app

# Define the periodic schedule
celery_app.conf.beat_schedule = {
    "run-sla-check-every-hour": {
        "task": "tasks.check_sla_violations",
        "schedule": 3600.0, # Runs every hour (3600 seconds)
    },
    "daily-cleanup-report": {
        "task": "tasks.check_sla_violations", # Example reuse
        "schedule": crontab(hour=0, minute=0), # Runs at midnight every day
    },
}