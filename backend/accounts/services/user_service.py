"""
accounts/services/user_service.py
──────────────────────────────────
Pure-Python business-logic layer. No HTTP, no serializers.
Views call these functions; services call selectors + models.
"""

from __future__ import annotations
from typing import Optional
from django.db import transaction

from accounts.models import Role, User
from accounts.services.crypto import decrypt_api_key, encrypt_api_key, validate_gemini_key
from accounts.selectors.user_selector import get_user_by_email, get_user_by_id


# ── Registration ──────────────────────────────────────────────────────────────

def register_admin(
    email: str,
    password: str,
    gemini_api_key: str,
) -> User:
    """
    Public-facing registration: creates a user with role=ADMIN.
    gemini_api_key is required - validated and encrypted before saving.
    """
    if get_user_by_email(email) is not None:
        raise ValueError("A user with this email already exists.")

    encrypted_key = _prepare_gemini_key(gemini_api_key)

    with transaction.atomic():
        user = User.objects.create_admin(
            email=email,
            password=password,
            gemini_api_key=encrypted_key,
        )
    return user


# ── System-level creators (used by project service, NOT exposed via API) ──────

def create_project_manager(email: str, password: str) -> User:
    """Called by project service when a project is created."""
    if get_user_by_email(email) is not None:
        raise ValueError(f"User {email} already exists.")
    return User.objects.create_manager(email=email, password=password)


def create_project_staff(email: str, password: str) -> User:
    """Called by project service when a project is created."""
    if get_user_by_email(email) is not None:
        raise ValueError(f"User {email} already exists.")
    return User.objects.create_staff(email=email, password=password)


# ── Read ──────────────────────────────────────────────────────────────────────

def get_user(user_id: int) -> User:
    user = get_user_by_id(user_id)
    if user is None:
        raise User.DoesNotExist(f"User #{user_id} not found.")
    return user


def get_decrypted_gemini_key(user: User) -> Optional[str]:
    """Return the plaintext Gemini API key, or None if not set."""
    if not user.gemini_api_key:
        return None
    return decrypt_api_key(user.gemini_api_key)


# ── Update ────────────────────────────────────────────────────────────────────

def update_user(
    user: User,
    email: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
) -> User:
    """
    Partial update. Only provided (non-None) fields are changed.
    Admins can update their own email and Gemini key.
    """
    changed = []

    if email and email != user.email:
        if get_user_by_email(email) is not None:
            raise ValueError("A user with this email already exists.")
        user.email = email
        changed.append("email")

    if gemini_api_key is not None:
        if gemini_api_key == "":
            user.gemini_api_key = None
        else:
            user.gemini_api_key = _prepare_gemini_key(gemini_api_key)
        changed.append("gemini_api_key")

    if changed:
        user.save(update_fields=changed)
    return user


def update_project_member(
    user: User,
    email: Optional[str] = None,
    password: Optional[str] = None,
) -> User:
    """
    Update email and/or password of a manager/staff user.
    Called by: admin changing employee credentials, or employee changing their own.
    """
    changed = []

    if email and email != user.email:
        if get_user_by_email(email) is not None:
            raise ValueError("A user with this email already exists.")
        user.email = email
        changed.append("email")

    if password:
        user.set_password(password)
        changed.append("password")

    if changed:
        user.save(update_fields=changed)
    return user


def change_password(user: User, old_password: str, new_password: str) -> User:
    """User changes their own password - old password is verified."""
    if not user.check_password(old_password):
        raise ValueError("Old password is incorrect.")
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


def admin_set_password(user: User, new_password: str) -> User:
    """
    Admin sets a new password for a manager/staff user.
    No old-password verification required.
    """
    if user.role == Role.ADMIN:
        raise ValueError("Cannot use this endpoint to change an admin's password.")
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


def set_active(user: User, *, active: bool) -> User:
    user.is_active = active
    user.save(update_fields=["is_active"])
    return user


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_admin_and_cascade(admin_user: User) -> None:
    """
    Hard-delete an admin user. All projects they own (and the
    manager/staff users attached to those projects) are also deleted
    via DB cascade (see Project model's on_delete=CASCADE).
    """
    if admin_user.role != Role.ADMIN:
        raise ValueError("Only admin accounts can be self-deleted.")
    with transaction.atomic():
        admin_user.delete()


# ── Private helpers ───────────────────────────────────────────────────────────

def _prepare_gemini_key(raw_key: str) -> str:
    """Validate + encrypt a raw Gemini API key. Always required."""
    if not raw_key or not raw_key.strip():
        raise ValueError("Gemini API key is required.")
    if not validate_gemini_key(raw_key):
        raise ValueError("The provided Gemini API key is invalid.")
    return encrypt_api_key(raw_key)