"""
projects/selectors/project_selector.py
────────────────────────────────────────
All read-only DB queries for Project.
Zero business logic. Views and services import from here only.
"""

from __future__ import annotations
from typing import Optional
from django.db.models import QuerySet

from accounts.models import User, Role
from projects.models import Project


def get_project_by_id(project_id: int) -> Optional[Project]:
    return Project.objects.filter(pk=project_id).select_related(
        "admin", "manager", "staff"
    ).first()


def get_projects_for_admin(admin_user: User) -> QuerySet:
    """All projects owned by this admin."""
    return Project.objects.filter(admin=admin_user).select_related(
        "manager", "staff"
    ).order_by("-created_at")


def get_project_for_member(user: User) -> Optional[Project]:
    """
    Returns the single project this manager/staff belongs to.
    Returns None if the user is not a manager or staff.
    """
    if user.role == Role.MANAGER:
        return Project.objects.filter(manager=user).select_related(
            "admin", "staff"
        ).first()
    if user.role == Role.STAFF:
        return Project.objects.filter(staff=user).select_related(
            "admin", "manager"
        ).first()
    return None


def user_belongs_to_project(user: User, project: Project) -> bool:
    """
    Single source of truth for project membership check.
    Works for all three roles.
    """
    return (
        project.admin_id  == user.pk
        or project.manager_id == user.pk
        or project.staff_id   == user.pk
    )


def admin_owns_project(admin_user: User, project: Project) -> bool:
    """Returns True only if this admin is the owner of this specific project."""
    return project.admin_id == admin_user.pk