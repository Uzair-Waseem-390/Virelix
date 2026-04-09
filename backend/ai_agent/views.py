"""
ai_agent/views.py
──────────────────
Business Analyst agent chat views.

Every view runs the following checks before any logic executes:
  1. Project exists
  2. Project membership — request.user belongs to this project
  3. Chat ownership    — the chat belongs to this user (on detail/send/delete)

URL pattern (all nested under a project):
  /projects/<project_pk>/ai/chats/              list + create
  /projects/<project_pk>/ai/chats/<pk>/         detail + delete
  /projects/<project_pk>/ai/chats/<pk>/send/    send message

The project is fetched ONCE in _get_context() and reused — same pattern
as sales/views.py.
"""

import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import is_project_member
from ai_agent.exceptions import MissingAPIKeyError
from ai_agent.models import AgentChat
from ai_agent.selectors.agent_selector import get_chat_by_id
from ai_agent.serializers import (
    AgentChatDetailSerializer,
    AgentChatListSerializer,
    AgentMessageSerializer,
    SendMessageSerializer,
)
from ai_agent.services.agent_service import (
    create_chat,
    delete_chat,
    list_chats,
    send_message,
)
from projects.selectors.project_selector import get_project_by_id

logger = logging.getLogger(__name__)


# ── Shared context helpers ─────────────────────────────────────────────────────

def _get_context(request, project_pk):
    """
    Fetch project, validate it exists, validate user is a project member.
    Returns (project, error_response). error_response is None on success.
    """
    project = get_project_by_id(project_pk)
    if project is None:
        return None, Response(
            {"detail": "Project not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not is_project_member(request.user, project):
        return None, Response(
            {"detail": "You are not a member of this project."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return project, None


def _get_chat_in_project(chat_pk, project_pk, user):
    """
    Fetch a chat and confirm it belongs to this project and this user.
    Returns (chat, error_response). error_response is None on success.
    """
    chat = get_chat_by_id(chat_pk)
    if chat is None:
        return None, Response(
            {"detail": "Chat not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if chat.project_id != project_pk:
        return None, Response(
            {"detail": "Chat does not belong to this project."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if chat.user_id != user.pk:
        return None, Response(
            {"detail": "You do not have permission to access this chat."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return chat, None


# ─────────────────────────────────────────────────────────────────────────────
# GET  /projects/<project_pk>/ai/chats/    list own chats
# POST /projects/<project_pk>/ai/chats/    create new chat
# ─────────────────────────────────────────────────────────────────────────────

class AgentChatListCreateView(APIView):
    """
    GET  — list all chats initiated by this user in this project.
    POST — open a new (empty) chat session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        """List all chats for the authenticated user in this project."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        chats = list_chats(project_id=project.pk, user_id=request.user.pk)
        return Response(AgentChatListSerializer(chats, many=True).data)

    def post(self, request, project_pk):
        """
        Create a new chat session.
        Returns the empty chat object — messages are added via /send/.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        chat = create_chat(project=project, user=request.user)
        return Response(
            AgentChatDetailSerializer(chat).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET    /projects/<project_pk>/ai/chats/<pk>/    detail + history
# DELETE /projects/<project_pk>/ai/chats/<pk>/    delete chat
# ─────────────────────────────────────────────────────────────────────────────

class AgentChatDetailView(APIView):
    """
    GET    — retrieve chat with full message history.
    DELETE — permanently delete chat and all its messages.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk, pk):
        """Retrieve a chat with its complete message history."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        chat, err = _get_chat_in_project(pk, project.pk, request.user)
        if err:
            return err

        return Response(AgentChatDetailSerializer(chat).data)

    def delete(self, request, project_pk, pk):
        """
        Permanently delete a chat and all its messages.
        The user can only delete their own chats.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        chat, err = _get_chat_in_project(pk, project.pk, request.user)
        if err:
            return err

        try:
            delete_chat(
                chat_id         = chat.pk,
                project_id      = project.pk,
                requesting_user = request.user,
            )
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            {"detail": "Chat deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /projects/<project_pk>/ai/chats/<pk>/send/    send message
# ─────────────────────────────────────────────────────────────────────────────

class AgentMessageCreateView(APIView):
    """
    POST — send a message to the Business Analyst agent.

    Returns both the persisted user message and the assistant reply so the
    frontend can display both without a second API call.

    Body:
      { "message": "Show me last 2 months sales comparison" }

    Response:
      {
        "user_message":      { id, role, content, created_at },
        "assistant_message": { id, role, content, created_at }
      }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        project, err = _get_context(request, project_pk)
        if err:
            return err

        chat, err = _get_chat_in_project(pk, project.pk, request.user)
        if err:
            return err

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_text = serializer.validated_data["message"]

        try:
            assistant_msg = send_message(
                chat_id         = chat.pk,
                user_message    = user_text,
                project         = project,
                requesting_user = request.user,
            )
        except MissingAPIKeyError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RuntimeError as exc:
            logger.error("Agent runtime error: %s", exc)
            return Response(
                {"detail": "The AI agent encountered an error. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Re-fetch the user message (it was persisted inside send_message)
        from ai_agent.models import AgentMessage
        user_msg = (
            AgentMessage.objects
            .filter(chat=chat, role=AgentMessage.Role.USER)
            .order_by("-created_at")
            .first()
        )

        return Response({
            "user_message":      AgentMessageSerializer(user_msg).data,
            "assistant_message": AgentMessageSerializer(assistant_msg).data,
        }, status=status.HTTP_201_CREATED)
