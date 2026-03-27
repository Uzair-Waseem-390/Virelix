"""
accounts/selectors/user_selector.py
────────────────────────────────────
Read-only database queries.  All SELECT logic lives here so services
and views never write raw ORM queries (single responsibility + DRY).
"""

from __future__ import annotations

from typing import Optional

from accounts.models import User


def get_user_by_id(user_id: int) -> Optional[User]:
    return User.objects.filter(pk=user_id).first()


def get_user_by_email(email: str) -> Optional[User]:
    return User.objects.filter(email__iexact=email).first()


def get_all_users():
    """Return all non-superuser users (superuser is internal-only)."""
    return User.objects.filter(is_superuser=False).select_related()


def get_users_by_role(role: str):
    return User.objects.filter(role=role, is_superuser=False)


def get_active_users():
    return User.objects.filter(is_active=True, is_superuser=False)