"""
accounts/views.py
──────────────────
Thin HTTP layer only. Each view:
  1. Checks permissions
  2. Validates input via serializer
  3. Delegates to service layer
  4. Serializes + returns result

No ORM queries, no crypto, no business logic here.
"""

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from accounts.permissions import IsAdminRole
from accounts.selectors.user_selector import (
    get_user_by_id,
    get_project_users_for_admin,
    get_admin_owns_user,
)
from accounts.serializers import (
    AdminSetPasswordSerializer,
    ChangePasswordSerializer,
    ProjectMemberSerializer,
    RegisterSerializer,
    UpdateAdminSerializer,
    UpdateMemberSerializer,
    UserSerializer,
)
from accounts.services import user_service


# ─────────────────────────────────────────────────────────────────────────────
# POST /accounts/register/  (public)
# ─────────────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """
    Register a new user with role=ADMIN.
    Only self-service endpoint. Manager/staff are created by the system
    when a project is provisioned.
    """
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = user_service.register_admin(
                email          = serializer.validated_data["email"],
                password       = serializer.validated_data["password"],
                gemini_api_key = serializer.validated_data["gemini_api_key"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# GET  /accounts/me/           - own quick profile
# GET | PATCH /accounts/me/profile/  - own full profile + update
# DELETE /accounts/me/delete/  - admin self-delete (cascades projects+members)
# POST /accounts/me/change-password/ - own password change
# ─────────────────────────────────────────────────────────────────────────────

class MeView(generics.RetrieveAPIView):
    """Quick read of own profile."""
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class MeProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   -> full profile
    PATCH -> update own email / Gemini key (admin only fields)
    """
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names  = ["get", "patch"]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return Response(UserSerializer(self.get_object()).data)

    def partial_update(self, request, *args, **kwargs):
        serializer = UpdateAdminSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated = user_service.update_user(
                user           = request.user,
                email          = serializer.validated_data.get("email"),
                gemini_api_key = serializer.validated_data.get("gemini_api_key"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(updated).data)


class MeDeleteView(generics.DestroyAPIView):
    """
    Admin hard-deletes their own account.
    Cascades: all owned projects -> manager + staff users are also deleted.
    Manager/Staff cannot use this endpoint.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names  = ["delete"]

    def destroy(self, request, *args, **kwargs):
        try:
            user_service.delete_admin_and_cascade(request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Account and all related data permanently deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


class ChangePasswordView(APIView):
    """User changes their own password. Old password required."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_service.change_password(
                user         = request.user,
                old_password = serializer.validated_data["old_password"],
                new_password = serializer.validated_data["new_password"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Password updated successfully."})


# ─────────────────────────────────────────────────────────────────────────────
# Admin: manage their project members
# GET    /accounts/users/               - list own project members
# GET    /accounts/users/<pk>/          - get member detail
# PATCH  /accounts/users/<pk>/          - update member email
# POST   /accounts/users/<pk>/change-password/ - set member password (no old pw)
# POST   /accounts/users/<pk>/activate/
# POST   /accounts/users/<pk>/deactivate/
#
# NOTE: Admin CANNOT delete manager/staff directly.
#       They are deleted when the project is deleted.
# ─────────────────────────────────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    """
    List all manager + staff users that belong to this admin's projects.
    Admin cannot see other admins' users.
    """
    serializer_class   = ProjectMemberSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        return get_project_users_for_admin(self.request.user)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   -> member profile (admin only, scoped to own projects)
    PATCH -> update member email (admin only, scoped to own projects)
    """
    serializer_class   = ProjectMemberSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names  = ["get", "patch"]

    def _get_member_or_403(self, pk):
        """Fetch user, verify they belong to this admin's projects."""
        user = get_user_by_id(pk)
        if user is None:
            return None, Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if not get_admin_owns_user(self.request.user, user):
            return None, Response(
                {"detail": "You do not have permission to access this user."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return user, None

    def retrieve(self, request, pk=None, *args, **kwargs):
        user, err = self._get_member_or_403(pk)
        if err:
            return err
        return Response(ProjectMemberSerializer(user).data)

    def partial_update(self, request, pk=None, *args, **kwargs):
        user, err = self._get_member_or_403(pk)
        if err:
            return err

        # Admin cannot update another admin's profile via this endpoint
        if user.role == Role.ADMIN:
            return Response(
                {"detail": "Use /accounts/me/profile/ to update your own profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UpdateMemberSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated = user_service.update_project_member(
                user  = user,
                email = serializer.validated_data.get("email"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProjectMemberSerializer(updated).data)


class AdminSetPasswordView(APIView):
    """
    Admin sets a new password for a manager/staff user.
    Old password NOT required. Cannot be used on other admins.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        user = get_user_by_id(pk)
        if user is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not get_admin_owns_user(request.user, user):
            return Response(
                {"detail": "You do not have permission to change this user's password."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == Role.ADMIN:
            return Response(
                {"detail": "Cannot change another admin's password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdminSetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_service.admin_set_password(
                user         = user,
                new_password = serializer.validated_data["new_password"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": f"Password updated for {user.email}."})


class ActivateUserView(APIView):
    """Admin activates a project member account."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        user = get_user_by_id(pk)
        if user is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not get_admin_owns_user(request.user, user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        user_service.set_active(user, active=True)
        return Response({"detail": f"User {user.email} activated."})


class DeactivateUserView(APIView):
    """Admin deactivates a project member account."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        user = get_user_by_id(pk)
        if user is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not get_admin_owns_user(request.user, user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        if user.pk == request.user.pk:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_service.set_active(user, active=False)
        return Response({"detail": f"User {user.email} deactivated."})