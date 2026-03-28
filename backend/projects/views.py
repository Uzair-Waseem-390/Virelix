"""
projects/views.py
──────────────────
Thin HTTP layer. Permission model:

  POST   /projects/                    admin only
  GET    /projects/                    admin -> own projects | manager/staff -> own project
  GET    /projects/<id>/               any project member
  PATCH  /projects/<id>/               admin owner only
  DELETE /projects/<id>/               admin owner only
  GET    /projects/<id>/dashboard/     any project member
  GET    /projects/<id>/ai-status/     admin owner only
  PATCH  /projects/<id>/manager/       admin owner only
  PATCH  /projects/<id>/staff/         admin owner only

Two-layer security on every view:
  Layer 1 -> permission_classes (role check)
  Layer 2 -> _get_project_for_admin / _get_project_for_member (scope check)
"""

import logging
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from projects.permissions import IsAdminRole
from projects.selectors.project_selector import (
    get_project_by_id,
    get_projects_for_admin,
    get_project_for_member,
    admin_owns_project,
    user_belongs_to_project,
)
from projects.serializers import (
    CreateProjectSerializer,
    ProjectListSerializer,
    ProjectSerializer,
    UpdateMemberCredentialsSerializer,
    UpdateProjectSerializer,
)
from projects.services.project_service import (
    create_project,
    delete_project,
    update_project,
    update_project_member_credentials,
)
from ai_agent.services import dispatch_analysis, get_task_status
from ai_agent.exceptions import MissingAPIKeyError

logger = logging.getLogger(__name__)


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _get_project_for_admin(request, project_id):
    """Fetch project and verify requesting admin owns it."""
    project = get_project_by_id(project_id)
    if project is None:
        return None, Response(
            {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
        )
    if not admin_owns_project(request.user, project):
        return None, Response(
            {"detail": "You do not own this project."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return project, None


def _get_project_for_member(request, project_id):
    """Fetch project and verify requesting user is a member."""
    project = get_project_by_id(project_id)
    if project is None:
        return None, Response(
            {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
        )
    if not user_belongs_to_project(request.user, project):
        return None, Response(
            {"detail": "You are not a member of this project."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return project, None


# ─────────────────────────────────────────────────────────────────────────────
# POST /projects/    - create (admin only)
# GET  /projects/    - list   (admin: own projects | manager/staff: own project)
# ─────────────────────────────────────────────────────────────────────────────

class ProjectListCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateProjectSerializer
        return ProjectListSerializer

    def get(self, request):
        """
        Admin  -> list of their own projects.
        Manager/Staff -> returns their single project directly.
        """
        if request.user.role == Role.ADMIN:
            projects = get_projects_for_admin(request.user)
            return Response(ProjectListSerializer(projects, many=True).data)

        project = get_project_for_member(request.user)
        if project is None:
            return Response(
                {"detail": "You are not assigned to any project."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ProjectSerializer(project).data)

    def post(self, request):
        """
        Create a project. Admin only.

        Flow:
          1. Validate input (name + description)
          2. Create Project row + auto-generate manager & staff users
          3. Dispatch Celery AI task to analyze description
          4. Return 202 with project data + task_id for polling

        Why modules start as False:
          has_products / has_inventory / has_sales all start False.
          The Celery worker runs the AI agent against the description,
          gets back an ERPModuleConfig, then writes the True/False values
          directly into the DB (Project.objects.filter(pk=...).update(...)).
          Poll GET /projects/<id>/ai-status/ until ai_status == "done",
          then the module flags will reflect what the AI decided.
        """
        if request.user.role != Role.ADMIN:
            return Response(
                {"detail": "Only admin users can create projects."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CreateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ── Step 1: create project + members ─────────────────────────────────
        try:
            project, member_credentials = create_project(
                admin_user  = request.user,
                name        = serializer.validated_data["name"],
                description = serializer.validated_data["description"],
            )
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # ── Step 2: dispatch AI task ──────────────────────────────────────────
        # Re-fetch user from DB to guarantee gemini_api_key is loaded fresh
        # (JWT request.user may be a cached object without the encrypted field)
        from accounts.selectors.user_selector import get_user_by_id as get_fresh_user
        fresh_admin = get_fresh_user(request.user.pk)

        task_id = None
        ai_warning = None

        try:
            task_id = dispatch_analysis(
                project_id = project.pk,
                admin_user = fresh_admin,
            )
            logger.info(
                "AI task dispatched: task_id=%s project_id=%s",
                task_id, project.pk,
            )
        except MissingAPIKeyError as exc:
            # Project saved but AI cannot run yet
            ai_warning = str(exc)
            logger.warning(
                "Project %s created but AI skipped - no Gemini key: %s",
                project.pk, exc,
            )
        except Exception as exc:
            # Any other dispatch failure - project is still saved
            ai_warning = f"AI task could not be dispatched: {exc}"
            logger.error(
                "Failed to dispatch AI task for project %s: %s",
                project.pk, exc,
            )

        response_data = {
            "task_id":            task_id,
            "project":            ProjectSerializer(project).data,
            "member_credentials": member_credentials,
        }
        if ai_warning:
            response_data["ai_warning"] = ai_warning

        return Response(response_data, status=status.HTTP_202_ACCEPTED)


# ─────────────────────────────────────────────────────────────────────────────
# GET    /projects/<id>/
# PATCH  /projects/<id>/
# DELETE /projects/<id>/
# ─────────────────────────────────────────────────────────────────────────────

class ProjectDetailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Any project member can read. Scope: must belong to THIS project."""
        project, err = _get_project_for_member(request, pk)
        if err:
            return err
        return Response(ProjectSerializer(project).data)

    def patch(self, request, pk):
        """Update name/description. Admin owner only."""
        if request.user.role != Role.ADMIN:
            return Response(
                {"detail": "Only the project owner can update project details."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project, err = _get_project_for_admin(request, pk)
        if err:
            return err

        serializer = UpdateProjectSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            project, description_changed = update_project(
                project     = project,
                admin_user  = request.user,
                name        = serializer.validated_data.get("name"),
                description = serializer.validated_data.get("description"),
            )
        except (PermissionError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        task_id = None
        if description_changed:
            from accounts.selectors.user_selector import get_user_by_id as get_fresh_user
            fresh_admin = get_fresh_user(request.user.pk)
            try:
                task_id = dispatch_analysis(
                    project_id = project.pk,
                    admin_user = fresh_admin,
                )
            except MissingAPIKeyError as exc:
                logger.warning("Re-analysis skipped - no Gemini key: %s", exc)
            except Exception as exc:
                logger.error("Re-analysis dispatch failed: %s", exc)

        return Response({
            "task_id": task_id,
            "project": ProjectSerializer(project).data,
        })

    def delete(self, request, pk):
        """
        Delete project. Admin owner only.
        CASCADE: manager + staff users are deleted with the project automatically.
        """
        if request.user.role != Role.ADMIN:
            return Response(
                {"detail": "Only the project owner can delete a project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project, err = _get_project_for_admin(request, pk)
        if err:
            return err

        try:
            delete_project(project=project, admin_user=request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            {"detail": "Project and all its members permanently deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects/<id>/dashboard/
# Any member of THIS project. Cross-project access blocked.
# ─────────────────────────────────────────────────────────────────────────────

class ProjectDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Project dashboard entry point.
        Returns role + module flags so the frontend renders the correct UI.
        A manager from project A cannot access project B's dashboard.
        """
        project, err = _get_project_for_member(request, pk)
        if err:
            return err

        if project.ai_status in ("pending", "processing"):
            return Response(
                {
                    "detail": "Project setup is still in progress. Poll /ai-status/ for updates.",
                    "ai_status": project.ai_status,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        if project.ai_status == "failed":
            return Response(
                {
                    "detail": "AI analysis failed. Contact your admin.",
                    "ai_status": project.ai_status,
                    "ai_error":  project.ai_error,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "project_id":      project.pk,
            "project_name":    project.name,
            "role":            request.user.role,
            "ai_status":       project.ai_status,
            "enabled_modules": project.enabled_modules,
            "has_products":    project.has_products,
            "has_inventory":   project.has_inventory,
            "has_sales":       project.has_sales,
        })


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects/<id>/ai-status/   admin owner polls task progress
# ─────────────────────────────────────────────────────────────────────────────

class ProjectAIStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, pk):
        """
        Poll AI analysis status. Returns project's ai_status + module flags.
        Optionally pass ?task_id=<id> to also get Celery task state.
        """
        project, err = _get_project_for_admin(request, pk)
        if err:
            return err

        response_data = {
            "ai_status":       project.ai_status,
            "ai_error":        project.ai_error,
            "enabled_modules": project.enabled_modules,
            "has_products":    project.has_products,
            "has_inventory":   project.has_inventory,
            "has_sales":       project.has_sales,
        }

        task_id = request.query_params.get("task_id")
        if task_id:
            response_data["celery_state"] = get_task_status(task_id)

        return Response(response_data)


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /projects/<id>/manager/   update manager email/password
# PATCH /projects/<id>/staff/     update staff  email/password
# Admin owner only.
# ─────────────────────────────────────────────────────────────────────────────

class UpdateManagerView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        project, err = _get_project_for_admin(request, pk)
        if err:
            return err

        serializer = UpdateMemberCredentialsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated_member = update_project_member_credentials(
                project     = project,
                admin_user  = request.user,
                member_type = "manager",
                email       = serializer.validated_data.get("email"),
                password    = serializer.validated_data.get("password"),
            )
        except (PermissionError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.serializers import ProjectMemberSerializer
        return Response({
            "detail":  "Manager credentials updated.",
            "manager": ProjectMemberSerializer(updated_member).data,
        })


class UpdateStaffView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        project, err = _get_project_for_admin(request, pk)
        if err:
            return err

        serializer = UpdateMemberCredentialsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated_member = update_project_member_credentials(
                project     = project,
                admin_user  = request.user,
                member_type = "staff",
                email       = serializer.validated_data.get("email"),
                password    = serializer.validated_data.get("password"),
            )
        except (PermissionError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.serializers import ProjectMemberSerializer
        return Response({
            "detail": "Staff credentials updated.",
            "staff":  ProjectMemberSerializer(updated_member).data,
        })
    
