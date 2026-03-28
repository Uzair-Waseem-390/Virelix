"""
inventory/permissions.py
─────────────────────────
Mirrors the products/permissions.py pattern exactly.
Same three-check model:
  1. Module check   — project.has_inventory must be True
  2. Membership     — user must belong to this project
  3. Role           — admin/manager = full access, staff = no delete
"""

from rest_framework.permissions import BasePermission
from accounts.models import Role


class IsAuthenticated(BasePermission):
    """Alias so inventory views only import from this module."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


# ── Role constants ────────────────────────────────────────────────────────────

FULL_ACCESS_ROLES = (Role.ADMIN, Role.MANAGER)          # all operations
READ_WRITE_ROLES  = (Role.ADMIN, Role.MANAGER, Role.STAFF)  # no delete


# ── Guard functions ───────────────────────────────────────────────────────────

def assert_inventory_module_enabled(project) -> None:
    """Raise PermissionError if the inventory module is disabled for this project."""
    if not project.has_inventory:
        raise PermissionError(
            "The Inventory module is not enabled for this project. "
            "Check your project's AI-configured module settings."
        )


def assert_project_member(user, project) -> None:
    """Raise PermissionError if user is not a member of this project."""
    from projects.selectors.project_selector import user_belongs_to_project
    if not user_belongs_to_project(user, project):
        raise PermissionError("You are not a member of this project.")


def assert_can_delete(user) -> None:
    """Raise PermissionError if user cannot delete inventory records."""
    if user.role not in FULL_ACCESS_ROLES:
        raise PermissionError("Staff users cannot delete inventory records.")


def assert_can_write(user) -> None:
    """Raise PermissionError if user cannot create or update inventory."""
    if user.role not in READ_WRITE_ROLES:
        raise PermissionError("You do not have permission to modify inventory.")