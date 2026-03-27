"""
projects/serializers.py
────────────────────────
Input validation + output shaping for Project endpoints.
Zero business logic here.
"""

from rest_framework import serializers
from accounts.serializers import ProjectMemberSerializer
from projects.models import Project


# ── Output ────────────────────────────────────────────────────────────────────

class ProjectSerializer(serializers.ModelSerializer):
    """Full project representation including nested member info."""
    admin_email      = serializers.EmailField(source="admin.email",   read_only=True)
    enabled_modules  = serializers.ListField(read_only=True)
    manager_details  = ProjectMemberSerializer(source="manager", read_only=True)
    staff_details    = ProjectMemberSerializer(source="staff",   read_only=True)

    class Meta:
        model  = Project
        fields = [
            "id",
            "name",
            "description",
            "admin_email",
            "manager_details",
            "staff_details",
            "ai_status",
            "ai_error",
            "has_products",
            "has_inventory",
            "has_sales",
            "enabled_modules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views - no nested members."""
    enabled_modules = serializers.ListField(read_only=True)

    class Meta:
        model  = Project
        fields = [
            "id",
            "name",
            "ai_status",
            "has_products",
            "has_inventory",
            "has_sales",
            "enabled_modules",
            "created_at",
        ]
        read_only_fields = fields


# ── Create ────────────────────────────────────────────────────────────────────

class CreateProjectSerializer(serializers.Serializer):
    name        = serializers.CharField(max_length=150)
    description = serializers.CharField(
        min_length = 20,
        help_text  = "Business description. At least 20 characters so the AI has enough context.",
    )

    def validate_name(self, value: str) -> str:
        return value.strip()

    def validate_description(self, value: str) -> str:
        return value.strip()


# ── Update ────────────────────────────────────────────────────────────────────

class UpdateProjectSerializer(serializers.Serializer):
    name        = serializers.CharField(max_length=150, required=False)
    description = serializers.CharField(min_length=20, required=False)

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field to update.")
        return data


class UpdateMemberCredentialsSerializer(serializers.Serializer):
    """Admin updating a project member's email and/or password."""
    email    = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field.")
        return data


# ── AI status polling ─────────────────────────────────────────────────────────

class TaskStatusSerializer(serializers.Serializer):
    """Returned by GET /projects/<id>/ai-status/"""
    task_id        = serializers.CharField(required=False, allow_null=True)
    ai_status      = serializers.CharField()
    ai_error       = serializers.CharField(allow_blank=True)
    enabled_modules = serializers.ListField()