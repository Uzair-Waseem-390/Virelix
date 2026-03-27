"""
accounts/serializers.py
────────────────────────
Input validation + output shaping.
No business logic – that belongs in services.
"""

from rest_framework import serializers

from accounts.models import User
from accounts.services.crypto import decrypt_api_key


# ── Output ────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """
    Safe read-only representation of a user.
    gemini_api_key is never exposed in plain text; a boolean flag is
    returned instead so the frontend knows whether a key is configured.
    """
    has_gemini_key = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            "id",
            "email",
            "role",
            "is_active",
            "has_gemini_key",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_has_gemini_key(self, obj: User) -> bool:
        return obj.has_gemini_key


# ── Registration ──────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    email           = serializers.EmailField()
    password        = serializers.CharField(write_only=True, min_length=8)
    gemini_api_key  = serializers.CharField(
        write_only=True,
        required=True,
        allow_blank=False,
        help_text="Gemini API key – required, will be encrypted at rest.",
    )

    def validate_email(self, value: str) -> str:
        return value.lower().strip()


# ── Update (partial) ──────────────────────────────────────────────────────────

class UpdateUserSerializer(serializers.Serializer):
    email          = serializers.EmailField(required=False)
    gemini_api_key = serializers.CharField(
        required=False,
        allow_blank=True,  # blank string = clear the key
        write_only=True,
        help_text="Pass an empty string to remove the stored key.",
    )

    def validate_email(self, value: str) -> str:
        return value.lower().strip()


# ── Password change ───────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)