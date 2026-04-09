"""
ai_agent/permissions.py
────────────────────────
Permission helpers for the ai_agent app.

Design rules:
  - Role check  → what kind of user are you?
  - Scope check → do you own / belong to the resource?
  - Raise PermissionError with a message; views convert this to 403.
"""

from ai_agent.models import AgentChat


# ── Chat ownership ────────────────────────────────────────────────────────────

def assert_chat_belongs_to_user(chat: AgentChat, user_id: int) -> None:
    """
    Raise PermissionError if the chat was not created by this user.
    Admins of the project can bypass this in views that choose to skip it.
    """
    if chat.user_id != user_id:
        raise PermissionError("You do not have permission to access this chat.")


def assert_chat_belongs_to_project(chat: AgentChat, project_id: int) -> None:
    """Raise PermissionError if the chat does not belong to the given project."""
    if chat.project_id != project_id:
        raise PermissionError("Chat does not belong to this project.")
