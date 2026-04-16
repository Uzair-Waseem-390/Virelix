"""
data_entry/views.py
────────────────────
All views require the DataEntry password (from settings.DATAENTRY_PASSWORD)
supplied via:
  - POST/PATCH/DELETE requests: in the JSON body as { "password": "..." }
  - GET requests             : as a query param  ?password=...
  - Any request              : as an HTTP header  X-DataEntry-Password: ...

The default DRF IsAuthenticated is intentionally NOT used here — this app
is an internal utility protected by its own secret token.
"""

import logging

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from data_entry.models import DataEntryHistory
from data_entry.permissions import HasDataEntryPassword
from data_entry.serializers import GenerateDataSerializer, VerifyPasswordSerializer
from data_entry.tasks import generate_fake_data
from projects.models import Project

logger = logging.getLogger(__name__)
User = get_user_model()


# ── Helper ─────────────────────────────────────────────────────────────────────

def _user_to_dict(u):
    """Return only the fields that exist on the custom User model."""
    return {
        "id":    u.id,
        "email": u.email,
        "role":  u.role,
    }


# ── Views ─────────────────────────────────────────────────────────────────────

class VerifyPasswordView(APIView):
    """
    POST /data_entry/verify-password/
    Body: { "password": "..." }
    Returns 200 if the password matches settings.DATAENTRY_PASSWORD.
    The frontend calls this first to decide whether to show the tool.
    """
    permission_classes = [AllowAny]   # password checked inside the serializer flow

    def post(self, request):
        serializer = VerifyPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # re-use the permission logic directly
        perm = HasDataEntryPassword()
        if not perm.has_permission(request, self):
            return Response(
                {"detail": "Invalid password."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({"success": True, "message": "Password verified."})


class ListUsersView(APIView):
    """
    GET /data_entry/users/?password=...
    Returns all users with id, email, role.
    Only admin-role users are returned — managers/staff are project-specific.
    """
    permission_classes = [HasDataEntryPassword]

    def get(self, request):
        # Return admins only — they are the ones who "own" projects.
        # Managers/staff are auto-created per-project and not useful for selection.
        users = list(
            User.objects.filter(role="admin")
            .order_by("email")
            .values("id", "email", "role")
        )
        return Response(users)


class ListProjectsView(APIView):
    """
    GET /data_entry/projects/?user_id=<id>&password=...
    Returns all projects where the given user is admin, manager, or staff.
    """
    permission_classes = [HasDataEntryPassword]

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return Response(
                {"detail": "user_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Project links a user as admin (FK) or manager/staff (OneToOne)
        projects = list(
            Project.objects.filter(
                Q(admin_id=user_id) |
                Q(manager_id=user_id) |
                Q(staff_id=user_id)
            )
            .distinct()
            .order_by("name")
            .values("id", "name", "description", "admin_id", "manager_id", "staff_id")
        )
        return Response(projects)


class ListProjectMembersView(APIView):
    """
    GET /data_entry/project-members/?project_id=<id>&password=...
    Returns the three users linked to a project (admin, manager, staff)
    so the frontend can display a role selector dropdown.
    """
    permission_classes = [HasDataEntryPassword]

    def get(self, request):
        project_id = request.query_params.get("project_id")
        if not project_id:
            return Response(
                {"detail": "project_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.select_related("admin", "manager", "staff").get(pk=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        members = []
        for member_user in [project.admin, project.manager, project.staff]:
            if member_user:
                members.append(_user_to_dict(member_user))

        return Response(members)


class GenerateDataView(APIView):
    """
    POST /data_entry/generate/
    Body:
      {
        "password":        "...",
        "project_id":      1,
        "user_id":         2,       # which project member generates the data
        "start_date":      "2024-01-01",
        "duration_days":   30,
        "customers_count": 50,
        "products_count":  10,
        "orders_per_day":  5
      }

    Creates a DataEntryHistory row (status=pending) and dispatches a Celery
    task. Returns the history_id so the frontend can poll for completion.
    """
    permission_classes = [HasDataEntryPassword]

    def post(self, request):
        serializer = GenerateDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data       = serializer.validated_data
        project_id = data["project_id"]
        user_id    = data["user_id"]

        # ── Validate FK references exist before creating history ──────────────
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": f"Project #{project_id} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": f"User #{user_id} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Validate that the user actually belongs to the project ────────────
        user_is_member = (
            project.admin_id   == user_id or
            project.manager_id == user_id or
            project.staff_id   == user_id
        )
        if not user_is_member:
            return Response(
                {"detail": "The selected user is not a member of this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Create history record ─────────────────────────────────────────────
        history = DataEntryHistory.objects.create(
            project_id  = project_id,
            user_id     = user_id,
            parameters  = {
                "start_date":      str(data["start_date"]),
                "duration_days":   data["duration_days"],
                "customers_count": data["customers_count"],
                "products_count":  data["products_count"],
                "orders_per_day":  data["orders_per_day"],
            },
        )

        # ── Dispatch Celery task — only passes history_id ─────────────────────
        generate_fake_data.delay(history.id)

        logger.info(
            "DataEntry task dispatched: history_id=%s project=%s user=%s",
            history.id, project.name, user.email,
        )

        return Response(
            {
                "success":    True,
                "message":    "Data generation started. Poll history_id for status.",
                "history_id": history.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class DataEntryHistoryView(APIView):
    """
    GET /data_entry/history/?project_id=<id>&password=...
    Returns all DataEntryHistory rows for a project, newest first.
    Useful for the frontend to show past runs and their statuses.
    """
    permission_classes = [HasDataEntryPassword]

    def get(self, request):
        project_id = request.query_params.get("project_id")

        qs = DataEntryHistory.objects.select_related("project", "user").order_by("-created_at")
        if project_id:
            qs = qs.filter(project_id=project_id)

        data = [
            {
                "id":            h.id,
                "project_id":    h.project_id,
                "project_name":  h.project.name,
                "user_id":       h.user_id,
                "user_email":    h.user.email if h.user else None,
                "status":        h.status,
                "parameters":    h.parameters,
                "error_message": h.error_message,
                "created_at":    h.created_at,
            }
            for h in qs
        ]
        return Response(data)
