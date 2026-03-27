"""
accounts/permissions.py
────────────────────────
All DRF permission classes for the accounts app.

Design rules:
  - Role check  -> what kind of user are you?
  - Scope check -> do you own / belong to the resource?
  - Never mix HTTP logic here; permissions return True/False only.
"""

from rest_framework.permissions import BasePermission

from accounts.models import Role


# ── Role-based ────────────────────────────────────────────────────────────────

class IsAdminRole(BasePermission):
    """Only users with role=ADMIN may proceed."""
    message = "Only admin users can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsManagerRole(BasePermission):
    message = "Only manager users can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.MANAGER
        )


class IsStaffRole(BasePermission):
    message = "Only staff users can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.STAFF
        )


class IsAdminOrManager(BasePermission):
    """Admin or Manager - used for write operations on ERP resources."""
    message = "Only admin or manager users can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.MANAGER)
        )


# ── Object-level ──────────────────────────────────────────────────────────────

class IsSelf(BasePermission):
    """Object-level: the requester IS the object (own-profile operations)."""
    message = "You can only access your own account."

    def has_object_permission(self, request, view, obj):
        return request.user.pk == obj.pk


# ── Utility helpers (imported by views & project app) ────────────────────────

def is_project_member(user, project) -> bool:
    """
    Returns True if `user` is the admin, manager, or staff of `project`.
    Single source of truth - import this everywhere instead of repeating the check.
    """
    return (
        project.admin_id == user.pk
        or project.manager_id == user.pk
        or project.staff_id == user.pk
    )


def get_user_project(user):
    """
    Returns the single project this manager/staff belongs to, or None.
    Admins can belong to many projects - use get_projects_for_admin() instead.
    """
    if user.role == Role.ADMIN:
        return None
    # Lazy import to avoid circular dependency
    from projects.models import Project
    return (
        Project.objects.filter(manager=user).first()
        or Project.objects.filter(staff=user).first()
    )