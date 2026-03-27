# backend/__init__.py
# This ensures the Celery app is loaded when Django starts,
# so that @shared_task decorators use the correct broker (Redis).
from .celery import app as celery_app

__all__ = ("celery_app",)
