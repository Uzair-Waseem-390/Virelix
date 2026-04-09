"""
ai_agent/services/agent_service.py
────────────────────────────────────
Business logic layer for the Business Analyst agent chat feature.

This is what views call — never call agent.py or selectors directly from views.
This layer:
  1. Validates ownership / preconditions
  2. Fetches history from DB via selectors
  3. Decrypts admin's Gemini key
  4. Runs the BusinessAnalystAgent synchronously
  5. Persists both message turns (user + assistant)
  6. Auto-sets chat title from the first message
  7. Returns the assistant AgentMessage for the view to serialize

Also provides dispatch_analysis and get_task_status (retained from services.py).
"""

from __future__ import annotations

import logging
from typing import Optional

from django.db import transaction

from accounts.models import User, Role
from accounts.services.crypto import decrypt_api_key
from ai_agent.exceptions import MissingAPIKeyError
from ai_agent.models import AgentChat, AgentMessage
from ai_agent.selectors.agent_selector import (
    get_chat_by_id,
    get_chat_history_as_dicts,
    get_chats_for_project_user,
    chat_belongs_to_project,
    chat_belongs_to_user,
)
from ai_agent.permissions import (
    assert_chat_belongs_to_project,
    assert_chat_belongs_to_user,
)

logger = logging.getLogger(__name__)


# ── Legacy ERP analysis helpers (retained, used by tasks.py) ─────────────────

def dispatch_analysis(project_id: int, admin_user: User) -> str:
    """
    Validate preconditions and fire the Celery task for ERP module analysis.

    Returns:
        task_id (str) — Celery task ID for status polling.
    """
    if admin_user.role != Role.ADMIN:
        raise PermissionError("Only admin users can trigger AI analysis.")

    if not admin_user.gemini_api_key:
        raise MissingAPIKeyError(
            "You must configure a Gemini API key in your profile before "
            "creating a project. Visit PATCH /accounts/me/profile/ to add it."
        )

    from ai_agent.tasks import analyze_project_description

    task = analyze_project_description.delay(
        project_id    = project_id,
        admin_user_id = admin_user.pk,
    )

    logger.info(
        "AI analysis task dispatched: task_id=%s project_id=%s admin=%s",
        task.id, project_id, admin_user.email,
    )

    return task.id


def analyze_sync(project_id: int, admin_user: User) -> dict:
    """
    Synchronous ERP analysis. Use ONLY in management commands/tests.
    """
    if admin_user.role != Role.ADMIN:
        raise PermissionError("Only admin users can trigger AI analysis.")

    if not admin_user.gemini_api_key:
        raise MissingAPIKeyError("Admin has no Gemini API key configured.")

    from ai_agent.tasks import analyze_project_description
    return analyze_project_description(
        project_id    = project_id,
        admin_user_id = admin_user.pk,
    )


def get_task_status(task_id: str) -> dict:
    """Query Celery result backend for task status."""
    from celery.result import AsyncResult
    result = AsyncResult(task_id)

    if result.state == "SUCCESS":
        return {"state": "SUCCESS", "result": result.result}

    if result.state == "FAILURE":
        return {"state": "FAILURE", "detail": str(result.result)}

    return {"state": result.state}


# ── Business Analyst Chat services ────────────────────────────────────────────

def create_chat(project, user: User) -> AgentChat:
    """
    Create a new (empty) AgentChat for the given project and user.

    Args:
        project : Project instance the chat is scoped to.
        user    : The authenticated user opening the chat.

    Returns:
        Newly created AgentChat.
    """
    chat = AgentChat.objects.create(
        project = project,
        user    = user,
        title   = "New Chat",
    )
    logger.info(
        "AgentChat created: id=%s project_id=%s user=%s",
        chat.pk, project.pk, user.email,
    )
    return chat


def list_chats(project_id: int, user_id: int):
    """
    Return all chats for this user in this project.
    Delegates to selector; no business logic here.
    """
    return get_chats_for_project_user(project_id=project_id, user_id=user_id)


def get_chat(chat_id: int, project_id: int, requesting_user: User) -> AgentChat:
    """
    Fetch a chat and validate it belongs to the project and the requesting user.

    Raises:
        AgentChat.DoesNotExist : chat not found
        PermissionError        : wrong project or wrong user
    """
    chat = get_chat_by_id(chat_id)
    if chat is None:
        raise AgentChat.DoesNotExist(f"Chat #{chat_id} not found.")

    assert_chat_belongs_to_project(chat, project_id)
    assert_chat_belongs_to_user(chat, requesting_user.pk)

    return chat


def send_message(
    chat_id: int,
    user_message: str,
    project,
    requesting_user: User,
) -> AgentMessage:
    """
    Send a user message to the Business Analyst agent and persist both turns.

    Flow:
      1. Validate chat ownership + project scope
      2. Load message history from DB
      3. Decrypt project admin's Gemini API key
      4. Run BusinessAnalystAgent synchronously
      5. Persist user message
      6. Persist assistant reply
      7. Update chat title if this is the first message
      8. Return the assistant AgentMessage

    Args:
        chat_id          : PK of the AgentChat to send to.
        user_message     : Raw text from the user.
        project          : Project instance (already validated before calling here).
        requesting_user  : The authenticated user.

    Returns:
        The persisted assistant AgentMessage.

    Raises:
        AgentChat.DoesNotExist   : chat not found
        PermissionError          : wrong project / wrong user
        MissingAPIKeyError       : project admin has no Gemini key
    """
    if not user_message or not user_message.strip():
        raise ValueError("Message cannot be empty.")

    # ── 1. Validate chat ownership ────────────────────────────────────────────
    chat = get_chat(chat_id=chat_id, project_id=project.pk, requesting_user=requesting_user)

    # ── 2. Load history ───────────────────────────────────────────────────────
    history = get_chat_history_as_dicts(chat_id=chat.pk)
    is_first_message = len(history) == 0

    # ── 3. Decrypt Gemini key from project admin ──────────────────────────────
    admin = project.admin
    if not admin.gemini_api_key:
        raise MissingAPIKeyError(
            "The project admin has not configured a Gemini API key. "
            "Ask the admin to add one at PATCH /accounts/me/profile/."
        )

    try:
        decrypted_key = decrypt_api_key(admin.gemini_api_key)
    except Exception as exc:
        raise RuntimeError(f"Failed to decrypt Gemini API key: {exc}") from exc

    # ── 4. Run the agent ──────────────────────────────────────────────────────
    from ai_agent.agent import run_analyst_chat

    try:
        reply = run_analyst_chat(
            decrypted_api_key = decrypted_key,
            project_id        = project.pk,
            history           = history,
            user_message      = user_message.strip(),
        )
    except Exception as exc:
        logger.error(
            "BusinessAnalystAgent failed for chat_id=%s project_id=%s: %s",
            chat_id, project.pk, exc,
        )
        raise

    # ── 5 & 6. Persist both turns atomically ─────────────────────────────────
    with transaction.atomic():
        user_msg = AgentMessage.objects.create(
            chat    = chat,
            role    = AgentMessage.Role.USER,
            content = user_message.strip(),
        )
        assistant_msg = AgentMessage.objects.create(
            chat    = chat,
            role    = AgentMessage.Role.ASSISTANT,
            content = reply,
        )

        # ── 7. Auto-title from first message ─────────────────────────────────
        if is_first_message:
            title = user_message.strip()[:80]
            AgentChat.objects.filter(pk=chat.pk).update(title=title)

    logger.info(
        "AgentChat message sent: chat_id=%s project_id=%s user=%s",
        chat.pk, project.pk, requesting_user.email,
    )

    return assistant_msg


def delete_chat(chat_id: int, project_id: int, requesting_user: User) -> None:
    """
    Hard-delete a chat and all its messages (CASCADE).

    Args:
        chat_id          : PK of the chat to delete.
        project_id       : Must match the chat's project.
        requesting_user  : Must be the chat's owner.

    Raises:
        AgentChat.DoesNotExist : chat not found
        PermissionError        : wrong project / wrong user
    """
    chat = get_chat(chat_id=chat_id, project_id=project_id, requesting_user=requesting_user)
    chat.delete()

    logger.info(
        "AgentChat deleted: id=%s project_id=%s user=%s",
        chat_id, project_id, requesting_user.email,
    )
