"""
products/permissions.py
────────────────────────
All permission logic for the products app, in one place.

Three checks are needed on every products request:
  1. Module check   — project.has_products must be True
  2. Membership check — user must belong to this project
  3. Role check     — what operation is the user allowed?
       admin   : full CRUD + hard delete
       manager : full CRUD + hard delete
       staff   : create, read, update ONLY (no delete)

These are composed in the view via the _get_context() helper
rather than stacking many DRF permission classes, because we need
the project object for checks 1 and 2, and fetching it once and
reusing it is the DRY approach.
"""

from rest_framework.permissions import BasePermission
from accounts.models import Role


class IsAuthenticated(BasePermission):
    """Alias so products views only import from this module."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


# ── Role constants ─────────────────────────────────────────────────────────────
# Used by views to gate specific operations without repeating literals.

FULL_ACCESS_ROLES  = (Role.ADMIN, Role.MANAGER)   # create, update, delete
READ_CREATE_ROLES  = (Role.ADMIN, Role.MANAGER, Role.STAFF)  # everything except delete


# ── Reusable guard functions (imported by views) ───────────────────────────────

def assert_products_module_enabled(project) -> None:
    """
    Raise PermissionError if the products module is disabled for this project.
    Call this at the top of every products view.
    """
    if not project.has_products:
        raise PermissionError(
            "The Products module is not enabled for this project. "
            "Check your project's AI-configured module settings."
        )


def assert_project_member(user, project) -> None:
    """Raise PermissionError if user is not a member of this project."""
    from projects.selectors.project_selector import user_belongs_to_project
    if not user_belongs_to_project(user, project):
        raise PermissionError("You are not a member of this project.")


def assert_can_delete(user) -> None:
    """Raise PermissionError if user's role does not allow deletion."""
    if user.role not in FULL_ACCESS_ROLES:
        raise PermissionError("Staff users cannot delete products.")


def assert_can_write(user) -> None:
    """Raise PermissionError if user's role does not allow create/update."""
    if user.role not in READ_CREATE_ROLES:
        raise PermissionError("You do not have permission to modify products.")