"""
ai_agent/services.py
─────────────────────
Service layer for the AI agent.

This is what views and other services call - never call agent.py or tasks.py
directly from views. This layer:
  1. Validates preconditions (admin role, key present)
  2. Decrypts the API key
  3. Fires the Celery task asynchronously
  4. Returns the task_id to the caller for polling

Synchronous analysis (for testing / management commands) is also available
via analyze_sync().
"""

from __future__ import annotations

import logging
from typing import Optional

from accounts.models import User, Role
from accounts.services.crypto import decrypt_api_key
from ai_agent.exceptions import MissingAPIKeyError

logger = logging.getLogger(__name__)


def dispatch_analysis(project_id: int, admin_user: User) -> str:
    """
    Validate preconditions and fire the Celery task.

    Args:
        project_id : PK of the Project to analyze.
        admin_user : The authenticated admin making the request.

    Returns:
        task_id (str) - Celery task ID for status polling.

    Raises:
        MissingAPIKeyError : admin has no Gemini key stored.
        PermissionError    : caller is not an admin.
    """
    if admin_user.role != Role.ADMIN:
        raise PermissionError("Only admin users can trigger AI analysis.")

    if not admin_user.gemini_api_key:
        raise MissingAPIKeyError(
            "You must configure a Gemini API key in your profile before "
            "creating a project. Visit PATCH /accounts/me/profile/ to add it."
        )

    # Import here to avoid circular import at module load time
    from ai_agent.tasks import analyze_project_description

    task = analyze_project_description.delay(
        project_id    = project_id,
        admin_user_id = admin_user.pk,
    )

    logger.info(
        "AI analysis task dispatched: task_id=%s project_id=%s admin=%s",
        task.id, project_id, admin_user.email,
    )

    return task.id


def analyze_sync(project_id: int, admin_user: User) -> dict:
    """
    Run the AI analysis synchronously (blocks until done).
    Use ONLY in management commands, tests, or the Django shell.
    Never call from a view - use dispatch_analysis() instead.

    Returns:
        dict with keys: status, project_id, enabled_modules
    """
    if admin_user.role != Role.ADMIN:
        raise PermissionError("Only admin users can trigger AI analysis.")

    if not admin_user.gemini_api_key:
        raise MissingAPIKeyError("Admin has no Gemini API key configured.")

    from ai_agent.tasks import analyze_project_description
    return analyze_project_description(
        project_id    = project_id,
        admin_user_id = admin_user.pk,
    )


def get_task_status(task_id: str) -> dict:
    """
    Query Celery result backend for task status.

    Returns a dict with keys:
      state   : PENDING | STARTED | SUCCESS | FAILURE | RETRY
      result  : task return value (if SUCCESS)
      detail  : error message (if FAILURE)
    """
    from celery.result import AsyncResult
    result = AsyncResult(task_id)

    if result.state == "SUCCESS":
        return {
            "state":  "SUCCESS",
            "result": result.result,
        }

    if result.state == "FAILURE":
        return {
            "state":  "FAILURE",
            "detail": str(result.result),
        }

    # PENDING / STARTED / RETRY
    return {"state": result.state}