"""
projects/permissions.py
────────────────────────
DRF permission classes scoped to the projects app.

These are COMPOSABLE - stack them in permission_classes lists.
They cover three axes:
  1. Role   - what role does the user have?
  2. Ownership - does this admin own this project?
  3. Membership - does this manager/staff belong to this project?
"""

from rest_framework.permissions import BasePermission

from accounts.models import Role
from projects.selectors.project_selector import (
    user_belongs_to_project,
    admin_owns_project,
)


class IsAdminRole(BasePermission):
    """Request-level: user must have role=ADMIN."""
    message = "Only admin users can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsProjectMember(BasePermission):
    """
    Object-level: the authenticated user must be a member of the project.
    Works for admin (owner), manager, and staff.
    Prevents a manager of project A from accessing project B.
    """
    message = "You are not a member of this project."

    def has_object_permission(self, request, view, obj):
        # obj is a Project instance
        return user_belongs_to_project(request.user, obj)


class IsProjectOwner(BasePermission):
    """
    Object-level: the authenticated user must be the ADMIN OWNER of the project.
    Stricter than IsProjectMember - used for write/delete operations.
    """
    message = "Only the project owner can perform this action."

    def has_object_permission(self, request, view, obj):
        return (
            request.user.role == Role.ADMIN
            and admin_owns_project(request.user, obj)
        )


class IsManagerOrStaffOfProject(BasePermission):
    """
    Object-level: user must be the manager or staff of this specific project.
    Blocks cross-project access even if both users are managers.
    """
    message = "You are not a manager or staff member of this project."

    def has_object_permission(self, request, view, obj):
        return (
            request.user.role in (Role.MANAGER, Role.STAFF)
            and user_belongs_to_project(request.user, obj)
        )