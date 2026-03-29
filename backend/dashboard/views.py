"""
dashboard/views.py
───────────────────
Two endpoints only:

  GET /dashboard/
    Admin main dashboard — aggregates across ALL owned projects.
    Manager/Staff are redirected to their project dashboard.

  GET /dashboard/projects/<project_pk>/
    Project-specific dashboard — one project.
    Accessible by admin (owner), manager, and staff of that project.
    Returns enabled_modules list so the frontend builds the correct sidebar.

Both are read-only. All underlying data is already managed by
products/inventory/sales apps — we reuse their selectors here (DRY).
"""

import logging
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from accounts.models import Role
from projects.selectors.project_selector import (
    get_project_by_id,
    get_project_for_member,
    user_belongs_to_project,
)
from dashboard.selectors import get_admin_dashboard_data, get_project_dashboard_data
from dashboard.serializers import AdminDashboardSerializer, ProjectDashboardSerializer

logger = logging.getLogger(__name__)


class MainDashboardView(APIView):
    """
    GET /dashboard/

    Admin   → full cross-project aggregate dashboard
    Manager → 302-style redirect info pointing to their project dashboard
    Staff   → 302-style redirect info pointing to their project dashboard

    The frontend uses the role + redirect_to fields to decide where to go.
    This makes the login flow simple: always hit GET /dashboard/ after login,
    and the backend tells you where you belong.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ── Manager / Staff → redirect to their single project dashboard ──────
        if user.role in (Role.MANAGER, Role.STAFF):
            project = get_project_for_member(user)
            if project is None:
                return Response(
                    {"detail": "You are not assigned to any project yet."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response({
                "role":        user.role,
                "redirect_to": f"/dashboard/projects/{project.pk}/",
                "project_id":  project.pk,
                "project_name": project.name,
            })

        # ── Admin → full main dashboard ───────────────────────────────────────
        if user.role == Role.ADMIN:
            data = get_admin_dashboard_data(user)
            serializer = AdminDashboardSerializer(data)
            return Response({
                "role": user.role,
                **serializer.data,
            })

        return Response(
            {"detail": "Unknown role."},
            status=status.HTTP_403_FORBIDDEN,
        )


class ProjectDashboardView(APIView):
    """
    GET /dashboard/projects/<project_pk>/

    Returns the project-specific dashboard payload.
    Accessible to any member of the project (admin owner, manager, staff).
    A manager from project A cannot access project B's dashboard — scope enforced.

    Key field: enabled_modules — the frontend uses this list to render
    only the modules that are active for this project in the sidebar.
    e.g. ["products", "sales"]  →  sidebar shows Products + Sales only
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        project = get_project_by_id(project_pk)
        if project is None:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Scope: user must be a member of THIS specific project
        if not user_belongs_to_project(request.user, project):
            return Response(
                {"detail": "You are not a member of this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # AI must be done before the dashboard is usable
        if project.ai_status in ("pending", "processing"):
            return Response(
                {
                    "detail": "Project setup is still in progress. Poll /projects/<id>/ai-status/ for updates.",
                    "ai_status":       project.ai_status,
                    "project_id":      project.pk,
                    "enabled_modules": [],
                },
                status=status.HTTP_202_ACCEPTED,
            )

        if project.ai_status == "failed":
            return Response(
                {
                    "detail":     "AI analysis failed for this project. Contact your admin.",
                    "ai_status":  project.ai_status,
                    "ai_error":   project.ai_error,
                    "project_id": project.pk,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = get_project_dashboard_data(project)
        serializer = ProjectDashboardSerializer(data)
        return Response({
            "role": request.user.role,
            **serializer.data,
        })