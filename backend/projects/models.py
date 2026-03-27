"""
projects/models.py
───────────────────
Project model - the central entity of Virelix.

Key design decisions:
  - admin    : FK to User (role=ADMIN). One admin owns many projects.
  - manager  : OneToOne to User (role=MANAGER). Exactly one per project.
  - staff    : OneToOne to User (role=STAFF).   Exactly one per project.

  - manager/staff use OneToOne because a manager/staff belongs to exactly
    one project. This enforces the business rule at the DB level and gives
    us clean reverse accessors: user.managed_project / user.staffed_project
    (used in user_selector.py).

  - on_delete=CASCADE for manager/staff: when a Project is deleted, the
    linked manager and staff User rows are also deleted automatically.
    This satisfies the requirement "manager/staff can only be deleted via
    project deletion".

  - admin uses on_delete=CASCADE too so when an admin self-deletes
    (MeDeleteView), all their projects (and project members) disappear.

  - ai_status tracks the Celery task state so the frontend can poll:
      pending    -> project saved, task not yet started
      processing -> Celery worker is running the agent
      done       -> modules configured successfully
      failed     -> agent or network error (see ai_error)

  - has_products / has_inventory / has_sales are written by the Celery
    task after AI analysis and control which ERP modules are accessible.
"""

from django.db import models
from django.conf import settings


class AIStatus(models.TextChoices):
    PENDING    = "pending",    "Pending"
    PROCESSING = "processing", "Processing"
    DONE       = "done",       "Done"
    FAILED     = "failed",     "Failed"


class Project(models.Model):
    # ── Ownership ──────────────────────────────────────────────────────────────
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete    = models.CASCADE,
        related_name = "owned_projects",
        help_text    = "The admin who created and owns this project.",
    )

    # ── Project members (system-created, one each) ─────────────────────────────
    manager = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete    = models.CASCADE,          # delete user when project deleted
        related_name = "managed_project",
        null         = True,
        blank        = True,
        help_text    = "Manager user auto-created when project is provisioned.",
    )
    staff = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete    = models.CASCADE,          # delete user when project deleted
        related_name = "staffed_project",
        null         = True,
        blank        = True,
        help_text    = "Staff user auto-created when project is provisioned.",
    )

    # ── Project details ────────────────────────────────────────────────────────
    name        = models.CharField(max_length=150)
    description = models.TextField(help_text="Business description fed to the AI agent.")

    # ── AI analysis state ──────────────────────────────────────────────────────
    ai_status = models.CharField(
        max_length = 20,
        choices    = AIStatus.choices,
        default    = AIStatus.PENDING,
    )
    ai_error = models.TextField(blank=True, default="")

    # ── ERP module flags (written by Celery task) ──────────────────────────────
    has_products  = models.BooleanField(default=False)
    has_inventory = models.BooleanField(default=False)
    has_sales     = models.BooleanField(default=False)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering        = ["-created_at"]
        verbose_name    = "Project"
        verbose_name_plural = "Projects"

    def __str__(self) -> str:
        return f"{self.name} (admin: {self.admin.email})"

    # ── Convenience ───────────────────────────────────────────────────────────

    @property
    def is_ai_done(self) -> bool:
        return self.ai_status == AIStatus.DONE

    @property
    def is_ai_pending(self) -> bool:
        return self.ai_status in (AIStatus.PENDING, AIStatus.PROCESSING)

    @property
    def enabled_modules(self) -> list:
        modules = []
        if self.has_products:
            modules.append("products")
        if self.has_inventory:
            modules.append("inventory")
        if self.has_sales:
            modules.append("sales")
        return modules