"""
ai_agent/tasks.py
──────────────────
Celery tasks for the AI agent layer.

Why Celery?
  - AI API calls can take 5-30 seconds. We never block the HTTP request cycle.
  - The view fires the task and immediately returns a 202 Accepted with a task_id.
  - The frontend polls GET /projects/<id>/ai-status/ to check completion.

Task flow:
  POST /projects/  (view)
    -> fire analyze_project_description.delay(project_id, admin_user_id)
    -> return 202 { "task_id": "...", "project_id": ... }

  Celery worker:
    -> fetch project + admin user
    -> decrypt Gemini key
    -> call ERPAnalysisAgent.analyze(description)
    -> save ERPModuleConfig booleans to Project
    -> mark project.ai_status = "done" | "failed"
"""

from __future__ import annotations

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind          = True,
    name          = "ai_agent.tasks.analyze_project_description",
    max_retries   = 2,
    default_retry_delay = 10,   # seconds between retries
    acks_late     = True,        # task stays in queue until acknowledged
)
def analyze_project_description(self, project_id: int, admin_user_id: int) -> dict:
    """
    Celery task: analyze a project's description and save module config.

    Args:
        project_id    : PK of the Project to analyze and update.
        admin_user_id : PK of the admin User whose Gemini key is used.

    Returns:
        dict with task result summary (stored in result backend).

    Side effects:
        - Updates Project.has_products / has_inventory / has_sales
        - Updates Project.ai_status = "done" | "failed"
        - Updates Project.ai_error  on failure
    """
    # Lazy imports keep module loading fast and avoid circular imports
    from projects.models import Project
    from accounts.models import User
    from accounts.services.crypto import decrypt_api_key
    from ai_agent.agent import analyze_description

    # ── 1. Fetch project ──────────────────────────────────────────────────────
    try:
        project = Project.objects.select_related("admin").get(pk=project_id)
    except Project.DoesNotExist:
        logger.error("Task received unknown project_id=%s", project_id)
        return {"status": "error", "detail": "Project not found."}

    # ── 2. Fetch admin user ───────────────────────────────────────────────────
    try:
        admin = User.objects.get(pk=admin_user_id)
    except User.DoesNotExist:
        logger.error("Task received unknown admin_user_id=%s", admin_user_id)
        _mark_failed(project, "Admin user not found.")
        return {"status": "error", "detail": "Admin user not found."}

    # ── 3. Decrypt Gemini API key ─────────────────────────────────────────────
    if not admin.gemini_api_key:
        detail = "Admin has no Gemini API key configured."
        logger.error(detail)
        _mark_failed(project, detail)
        return {"status": "error", "detail": detail}

    try:
        decrypted_key = decrypt_api_key(admin.gemini_api_key)
    except Exception as exc:
        detail = f"Failed to decrypt Gemini API key: {exc}"
        logger.error(detail)
        _mark_failed(project, detail)
        return {"status": "error", "detail": detail}

    # ── 4. Mark project as processing ─────────────────────────────────────────
    Project.objects.filter(pk=project_id).update(ai_status="processing")

    # ── 5. Run the AI agent ───────────────────────────────────────────────────
    try:
        config = analyze_description(
            decrypted_api_key = decrypted_key,
            description       = project.description,
        )
    except ValueError as exc:
        # Bad input (empty description etc.) - don't retry
        logger.warning("ERP agent ValueError for project %s: %s", project_id, exc)
        _mark_failed(project, str(exc))
        return {"status": "error", "detail": str(exc)}

    except Exception as exc:
        # Network / auth failures - eligible for retry
        logger.error(
            "ERP agent failed for project %s (attempt %s): %s",
            project_id, self.request.retries, exc,
        )
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            _mark_failed(project, f"AI analysis failed after retries: {exc}")
            return {"status": "error", "detail": str(exc)}

    # ── 6. Safety fallback: if all modules are false for a commercial description ─
    # A description explicitly requesting an ERP/business system should never
    # result in zero enabled modules - that would leave the project unusable.
    _ERP_KEYWORDS = ("erp", "enterprise", "business", "shop", "store", "sales",
                     "inventory", "product", "trade", "commerce", "retail", "wholesale")
    desc_lower = project.description.lower()
    if not config.any_enabled() and any(kw in desc_lower for kw in _ERP_KEYWORDS):
        logger.warning(
            "AI returned all-false for project %s despite ERP-related description. "
            "Defaulting to all modules enabled.",
            project_id,
        )
        config = config.model_copy(update={"products": True, "inventory": True, "sales": True})

    # ── 7. Persist the module config to the project ───────────────────────────
    module_fields = config.to_project_fields()   # {"has_products": bool, ...}
    Project.objects.filter(pk=project_id).update(
        ai_status = "done",
        ai_error  = "",
        **module_fields,
    )

    logger.info(
        "Project %s AI analysis complete. Modules: %s",
        project_id, config.enabled_modules(),
    )

    return {
        "status":          "done",
        "project_id":      project_id,
        "enabled_modules": config.enabled_modules(),
    }


# ── Private helpers ───────────────────────────────────────────────────────────

def _mark_failed(project, detail: str) -> None:
    """Update project status to failed without raising."""
    try:
        from projects.models import Project
        Project.objects.filter(pk=project.pk).update(
            ai_status = "failed",
            ai_error  = detail[:500],   # cap at 500 chars
        )
    except Exception as exc:
        logger.error("Could not mark project %s as failed: %s", project.pk, exc)