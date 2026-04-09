"""
ai_agent/serializers.py
────────────────────────
Input validation + output shaping for Business Analyst chat endpoints.
Zero business logic here.
"""

from rest_framework import serializers
from ai_agent.models import AgentChat, AgentMessage


# ── Output: Messages ──────────────────────────────────────────────────────────

class AgentMessageSerializer(serializers.ModelSerializer):
    """A single message turn (user or assistant)."""

    class Meta:
        model  = AgentMessage
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = fields


# ── Output: Chat (list view — no messages) ────────────────────────────────────

class AgentChatListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing chats — no message content."""
    message_count = serializers.SerializerMethodField()

    class Meta:
        model  = AgentChat
        fields = ["id", "title", "message_count", "created_at", "updated_at"]
        read_only_fields = fields

    def get_message_count(self, obj: AgentChat) -> int:
        return obj.messages.count()


# ── Output: Chat (detail view — includes messages) ────────────────────────────

class AgentChatDetailSerializer(serializers.ModelSerializer):
    """Full chat with ordered message history."""
    messages = AgentMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model  = AgentChat
        fields = ["id", "title", "message_count", "messages", "created_at", "updated_at"]
        read_only_fields = fields

    def get_message_count(self, obj: AgentChat) -> int:
        return obj.messages.count()


# ── Input: Send a message ─────────────────────────────────────────────────────

class SendMessageSerializer(serializers.Serializer):
    """Validates the body of POST /ai/chats/<id>/send/."""
    message = serializers.CharField(
        min_length = 1,
        max_length = 4000,
        help_text  = "The user's message to the Business Analyst agent.",
    )

    def validate_message(self, value: str) -> str:
        return value.strip()
