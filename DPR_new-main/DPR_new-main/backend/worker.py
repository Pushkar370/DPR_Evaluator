from celery import Celery
from backend.config import settings

celery_app = Celery(
    "dpr_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_publish_retry=True,
    worker_prefetch_multiplier=1, # Only one heavy task at a time per worker process
)

# Import tasks module so Celery workers can discover them
# This is done inside to avoid circular imports if services/tasks rely on celery_app
import backend.services
