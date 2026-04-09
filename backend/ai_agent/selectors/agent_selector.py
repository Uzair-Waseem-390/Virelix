"""
ai_agent/selectors/agent_selector.py
──────────────────────────────────────
Read-only database queries for AgentChat and AgentMessage.
All SELECT logic lives here - views and services never write raw ORM queries.
"""

from __future__ import annotations

from typing import Optional
from django.db.models import QuerySet

from ai_agent.models import AgentChat, AgentMessage


# ── AgentChat selectors ───────────────────────────────────────────────────────

def get_chat_by_id(chat_id: int) -> Optional[AgentChat]:
    """Fetch a single AgentChat by PK, or None if not found."""
    return AgentChat.objects.select_related("project", "user").filter(pk=chat_id).first()


def get_chats_for_project_user(project_id: int, user_id: int) -> QuerySet:
    """
    Return all chats that belong to the given project AND were started
    by the given user, ordered newest-first (by updated_at).
    """
    return (
        AgentChat.objects
        .filter(project_id=project_id, user_id=user_id)
        .order_by("-updated_at")
    )


def get_chats_for_project(project_id: int) -> QuerySet:
    """
    Return all chats for the given project (all users).
    Used by admin-level views.
    """
    return (
        AgentChat.objects
        .select_related("user")
        .filter(project_id=project_id)
        .order_by("-updated_at")
    )


def chat_belongs_to_project(chat: AgentChat, project_id: int) -> bool:
    """Return True if the chat belongs to the given project."""
    return chat.project_id == project_id


def chat_belongs_to_user(chat: AgentChat, user_id: int) -> bool:
    """Return True if the chat was created by the given user."""
    return chat.user_id == user_id


# ── AgentMessage selectors ────────────────────────────────────────────────────

def get_messages_for_chat(chat_id: int) -> QuerySet:
    """Return all messages for a chat, ordered chronologically."""
    return AgentMessage.objects.filter(chat_id=chat_id).order_by("created_at")


def get_chat_history_as_dicts(chat_id: int) -> list[dict]:
    """
    Return the full message history for a chat as a list of dicts.
    Format: [{"role": "user" | "assistant", "content": str}, ...]
    Used by the agent layer to reconstruct conversation context.
    """
    messages = get_messages_for_chat(chat_id)
    return [{"role": msg.role, "content": msg.content} for msg in messages]
