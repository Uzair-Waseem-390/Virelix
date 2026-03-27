"""
projects/services/project_service.py
──────────────────────────────────────
All business logic for Project creation, update, deletion, and member management.
Views call these functions. No HTTP objects here.
"""

from __future__ import annotations
import uuid
import logging
from typing import Optional

from django.db import transaction

from accounts.models import User, Role
from accounts.services.user_service import create_project_manager, create_project_staff
from projects.models import Project
from projects.selectors.project_selector import get_project_by_id, admin_owns_project

logger = logging.getLogger(__name__)


# ── Create ────────────────────────────────────────────────────────────────────

def create_project(admin_user: User, name: str, description: str) -> Project:
    """
    Create a project and auto-generate manager + staff users with demo credentials.

    Steps:
      1. Validate admin role
      2. Create Project row (ai_status=pending, modules all False)
      3. Generate unique demo emails for manager and staff
      4. Create manager User and staff User
      5. Attach them to the project
      6. Return the saved project (AI task dispatched separately by the view)

    The AI task is NOT fired here - the view fires it after getting the project_id.
    This keeps the service pure and testable.
    """
    if admin_user.role != Role.ADMIN:
        raise PermissionError("Only admin users can create projects.")

    with transaction.atomic():
        # ── 1. Create the project shell ───────────────────────────────────────
        project = Project.objects.create(
            admin       = admin_user,
            name        = name.strip(),
            description = description.strip(),
        )

        # ── 2. Generate demo credentials ──────────────────────────────────────
        uid = uuid.uuid4().hex[:6]   # short uid to keep emails readable

        manager_email    = f"manager.{uid}@{_slug(name)}.demo"
        manager_password = f"Manager@{uid}"

        staff_email    = f"staff.{uid}@{_slug(name)}.demo"
        staff_password = f"Staff@{uid}"

        # ── 3. Create member users ────────────────────────────────────────────
        manager_user = create_project_manager(
            email    = manager_email,
            password = manager_password,
        )
        staff_user = create_project_staff(
            email    = staff_email,
            password = staff_password,
        )

        # ── 4. Link to project ────────────────────────────────────────────────
        project.manager = manager_user
        project.staff   = staff_user
        project.save(update_fields=["manager", "staff"])

    logger.info(
        "Project created: id=%s name=%s admin=%s manager=%s staff=%s",
        project.pk, project.name, admin_user.email,
        manager_email, staff_email,
    )

    credentials = {
        "manager": {"email": manager_email, "password": manager_password},
        "staff":   {"email": staff_email,   "password": staff_password},
    }
    return project, credentials


# ── Update ────────────────────────────────────────────────────────────────────

def update_project(
    project: Project,
    admin_user: User,
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> Project:
    """
    Update project name and/or description.
    Only the owning admin can update their project.
    Re-triggers AI analysis if description changed.
    """
    _assert_admin_owns(admin_user, project)

    changed = []
    description_changed = False

    if name and name.strip() != project.name:
        project.name = name.strip()
        changed.append("name")

    if description and description.strip() != project.description:
        project.description = description.strip()
        project.ai_status   = "pending"
        project.ai_error    = ""
        changed.extend(["description", "ai_status", "ai_error"])
        description_changed = True

    if changed:
        project.save(update_fields=changed)

    return project, description_changed


def update_project_member_credentials(
    project: Project,
    admin_user: User,
    member_type: str,           # "manager" | "staff"
    email: Optional[str] = None,
    password: Optional[str] = None,
) -> User:
    """
    Admin updates the email and/or password of their project's manager or staff.
    member_type must be "manager" or "staff".
    """
    _assert_admin_owns(admin_user, project)

    if member_type == "manager":
        member = project.manager
    elif member_type == "staff":
        member = project.staff
    else:
        raise ValueError("member_type must be 'manager' or 'staff'.")

    if member is None:
        raise ValueError(f"This project has no {member_type} assigned.")

    from accounts.services.user_service import update_project_member
    return update_project_member(user=member, email=email, password=password)


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_project(project: Project, admin_user: User) -> None:
    """
    Hard-delete a project.
    The manager and staff users are deleted automatically via CASCADE.
    Only the owning admin can delete their project.
    """
    _assert_admin_owns(admin_user, project)

    with transaction.atomic():
        project.delete()

    logger.info(
        "Project deleted: id=%s name=%s by admin=%s",
        project.pk, project.name, admin_user.email,
    )


# ── Private helpers ───────────────────────────────────────────────────────────

def _assert_admin_owns(admin_user: User, project: Project) -> None:
    """Raise PermissionError if this admin does not own this project."""
    if not admin_owns_project(admin_user, project):
        raise PermissionError("You do not have permission to modify this project.")


def _slug(name: str) -> str:
    """Convert project name to lowercase slug for demo email domain."""
    import re
    return re.sub(r"[^a-z0-9]", "", name.lower())[:20] or "project"