"""
accounts/services/user_service.py
──────────────────────────────────
Pure-Python business-logic layer.  No HTTP, no serialisers.
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
    gemini_api_key: Optional[str] = None,
) -> User:
    """
    Public-facing registration: creates a user with role=ADMIN.
    Optionally validates + encrypts a Gemini API key.
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


# ── System-level creators (used by project service, not exposed via API) ──────

def create_manager(email: str, password: str) -> User:
    if get_user_by_email(email) is not None:
        raise ValueError(f"User {email} already exists.")
    return User.objects.create_manager(email=email, password=password)


def create_staff(email: str, password: str) -> User:
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
    Partial update.  Only provided (non-None) fields are changed.
    Email uniqueness is re-checked if it changes.
    """
    if email and email != user.email:
        if get_user_by_email(email) is not None:
            raise ValueError("A user with this email already exists.")
        user.email = email

    if gemini_api_key is not None:
        # Empty string → clear the key
        if gemini_api_key == "":
            user.gemini_api_key = None
        else:
            user.gemini_api_key = _prepare_gemini_key(gemini_api_key)

    user.save(update_fields=_changed_fields(user))
    return user


def change_password(user: User, old_password: str, new_password: str) -> User:
    if not user.check_password(old_password):
        raise ValueError("Old password is incorrect.")
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return user


def set_active(user: User, *, active: bool) -> User:
    user.is_active = active
    user.save(update_fields=["is_active"])
    return user


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_user(user: User) -> None:
    user.delete()


# ── Private helpers ───────────────────────────────────────────────────────────

def _prepare_gemini_key(raw_key: Optional[str]) -> Optional[str]:
    """Validate (optional) + encrypt a raw Gemini API key."""
    if not raw_key:
        return None
    if not validate_gemini_key(raw_key):
        raise ValueError("The provided Gemini API key is invalid.")
    return encrypt_api_key(raw_key)


def _changed_fields(user: User) -> list[str]:
    """Return field names that have been dirtied on the in-memory instance."""
    dirty = []
    for field in ("email", "gemini_api_key", "is_active"):
        dirty.append(field)     # save_fields is explicit – always pass all editable fields
    return dirty