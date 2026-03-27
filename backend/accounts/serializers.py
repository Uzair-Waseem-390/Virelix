"""
accounts/serializers.py
────────────────────────
Input validation + output shaping. Zero business logic here.
"""

from rest_framework import serializers
from accounts.models import User, Role


# ── Output ────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """
    Safe read representation. gemini_api_key is NEVER returned in plaintext;
    only a boolean `has_gemini_key` is exposed.
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


class ProjectMemberSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for manager/staff users (no gemini key field).
    Used when listing project members.
    """
    class Meta:
        model  = User
        fields = ["id", "email", "role", "is_active", "created_at"]
        read_only_fields = fields


# ── Registration ──────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.Serializer):
    email          = serializers.EmailField()
    password       = serializers.CharField(write_only=True, min_length=8)
    gemini_api_key = serializers.CharField(
        write_only=True,
        required=True,
        allow_blank=False,
        help_text="Gemini API key - required, encrypted at rest.",
    )

    def validate_email(self, value: str) -> str:
        return value.lower().strip()


# ── Admin self-update ─────────────────────────────────────────────────────────

class UpdateAdminSerializer(serializers.Serializer):
    """Admin updating their own email and/or Gemini key."""
    email          = serializers.EmailField(required=False)
    gemini_api_key = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        help_text="Pass empty string to remove the stored key.",
    )

    def validate_email(self, value: str) -> str:
        return value.lower().strip()


# ── Project member update (admin changing employee credentials) ───────────────

class UpdateMemberSerializer(serializers.Serializer):
    """Admin updating a manager/staff email or password."""
    email    = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    def validate_email(self, value: str) -> str:
        return value.lower().strip()

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field to update.")
        return data


# ── Password operations ───────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    """User changing their own password - old password required."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class AdminSetPasswordSerializer(serializers.Serializer):
    """Admin setting a new password for a manager/staff - no old password."""
    new_password = serializers.CharField(write_only=True, min_length=8)