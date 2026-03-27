"""
accounts/selectors/user_selector.py
────────────────────────────────────
Read-only database queries for User.
All SELECT logic lives here - views and services never write raw ORM queries.
"""

from __future__ import annotations
from typing import Optional
from django.db.models import Q, QuerySet

from accounts.models import User, Role


def get_user_by_id(user_id: int) -> Optional[User]:
    return User.objects.filter(pk=user_id).first()


def get_user_by_email(email: str) -> Optional[User]:
    return User.objects.filter(email__iexact=email).first()


def get_all_users() -> QuerySet:
    """All non-superuser users."""
    return User.objects.filter(is_superuser=False).order_by("-created_at")


def get_users_by_role(role: str) -> QuerySet:
    return User.objects.filter(role=role, is_superuser=False)


def get_project_users_for_admin(admin_user: User) -> QuerySet:
    """
    Returns all manager and staff users that belong to any project
    owned by this admin. Used for the admin's user-list endpoint.

    Uses the reverse OneToOne accessors defined on Project:
      manager -> related_name="managed_project"   -> user.managed_project
      staff   -> related_name="staffed_project"   -> user.staffed_project
    """
    from projects.models import Project

    # Get all project IDs owned by this admin
    project_ids = Project.objects.filter(admin=admin_user).values_list("id", flat=True)

    # managed_project__id and staffed_project__id traverse the reverse OneToOne
    return User.objects.filter(
        Q(managed_project__id__in=project_ids) |
        Q(staffed_project__id__in=project_ids)
    ).distinct().order_by("-created_at")


def get_admin_owns_user(admin_user: User, target_user: User) -> bool:
    """
    Returns True if target_user belongs to any project that admin_user owns.
    Admins can always access their own record.
    """
    if admin_user.pk == target_user.pk:
        return True
    if target_user.role == Role.ADMIN:
        # Admins are not members of other admins' projects
        return False

    from projects.models import Project
    return Project.objects.filter(
        admin=admin_user
    ).filter(
        Q(manager=target_user) | Q(staff=target_user)
    ).exists()