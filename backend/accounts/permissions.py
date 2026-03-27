"""
accounts/permissions.py
────────────────────────
Reusable, composable DRF permission classes.
Add new ones here – never scatter permission logic across views.
"""

from rest_framework.permissions import BasePermission

from accounts.models import Role


class IsAdminRole(BasePermission):
    """Allow access only to users with role=ADMIN (not Django superuser check)."""
    message = "Only admin users can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsSelfOrAdmin(BasePermission):
    """Object-level: allow if the requester is the owner OR an admin."""
    message = "You do not have permission to access this user."

    def has_object_permission(self, request, view, obj):
        return (
            request.user.pk == obj.pk
            or request.user.role == Role.ADMIN
        )