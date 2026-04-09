"""
ai_agent/services/__init__.py
──────────────────────────────
Re-exports public functions from agent_service so that existing callers
using `from ai_agent.services import dispatch_analysis, get_task_status`
continue to work without modification (backward-compatible).
"""

from ai_agent.services.agent_service import (   # noqa: F401
    dispatch_analysis,
    analyze_sync,
    get_task_status,
    create_chat,
    list_chats,
    get_chat,
    send_message,
    delete_chat,
)
