"""
accounts/views.py
──────────────────
Thin HTTP layer.  Each view:
  1. Validates input via a serializer
  2. Delegates to the service layer
  3. Serialises + returns the result

No ORM queries, no crypto, no business rules live here.
"""

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole, IsSelfOrAdmin
from accounts.selectors.user_selector import get_all_users, get_user_by_id
from accounts.serializers import (
    ChangePasswordSerializer,
    RegisterSerializer,
    UpdateUserSerializer,
    UserSerializer,
)
from accounts.services import user_service


# ─────────────────────────────────────────────────────────────────────────────
# Registration  (public)
# POST /accounts/register/
# ─────────────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """
    Register a new user with role=ADMIN.
    This is the only self-service endpoint; manager/staff are created by
    the system when a project is provisioned.
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
                gemini_api_key = serializer.validated_data.get("gemini_api_key"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# User list  (admin-only)
# GET /accounts/users/
# ─────────────────────────────────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    """List all non-superuser accounts.  Accessible to admins only."""
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        return get_all_users()


# ─────────────────────────────────────────────────────────────────────────────
# User detail / update / delete
# GET | PATCH | DELETE /accounts/users/<pk>/
# ─────────────────────────────────────────────────────────────────────────────

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → return user profile  (self or admin)
    PATCH  → partial update       (self or admin)
    DELETE → deactivate account   (admin only)
    """
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated, IsSelfOrAdmin]
    http_method_names  = ["get", "patch", "delete"]   # PUT not exposed

    def get_object(self):
        user = get_user_by_id(self.kwargs["pk"])
        if user is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("User not found.")
        self.check_object_permissions(self.request, user)
        return user

    # ── GET ──────────────────────────────────────────────────────────

    def retrieve(self, request, *args, **kwargs):
        return Response(UserSerializer(self.get_object()).data)

    # ── PATCH ─────────────────────────────────────────────────────────

    def partial_update(self, request, *args, **kwargs):
        user       = self.get_object()
        serializer = UpdateUserSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated = user_service.update_user(
                user           = user,
                email          = serializer.validated_data.get("email"),
                gemini_api_key = serializer.validated_data.get("gemini_api_key"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(updated).data)

    # ── DELETE ────────────────────────────────────────────────────────

    def destroy(self, request, *args, **kwargs):
        """Admins can hard-delete; deletion is restricted to IsAdminRole."""
        if request.user.role != "admin":
            return Response(
                {"detail": "Only admins can delete users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = self.get_object()
        user_service.delete_user(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# Current authenticated user
# GET /accounts/me/
# ─────────────────────────────────────────────────────────────────────────────

class MeView(generics.RetrieveAPIView):
    """Return the profile of the currently authenticated user."""
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─────────────────────────────────────────────────────────────────────────────
# Own profile – read + update
# GET | PATCH /accounts/me/profile/
# ─────────────────────────────────────────────────────────────────────────────

class MeProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   → full profile of the logged-in user
    PATCH → update own email and/or Gemini API key
    """
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ["get", "patch"]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return Response(UserSerializer(self.get_object()).data)

    def partial_update(self, request, *args, **kwargs):
        serializer = UpdateUserSerializer(data=request.data, partial=True)
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


# ─────────────────────────────────────────────────────────────────────────────
# Own account deletion
# DELETE /accounts/me/delete/
# ─────────────────────────────────────────────────────────────────────────────

class MeDeleteView(generics.DestroyAPIView):
    """
    Hard-delete the currently authenticated user's own account.
    No pk needed – always targets request.user.
    """
    permission_classes = [IsAuthenticated]
    http_method_names  = ["delete"]

    def get_object(self):
        return self.request.user

    def destroy(self, request, *args, **kwargs):
        user_service.delete_user(request.user)
        return Response(
            {"detail": "Your account has been permanently deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Password change
# POST /accounts/me/change-password/
# ─────────────────────────────────────────────────────────────────────────────

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class   = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
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
# Activate / Deactivate  (admin-only)
# POST /accounts/users/<pk>/activate/
# POST /accounts/users/<pk>/deactivate/
# ─────────────────────────────────────────────────────────────────────────────

class ActivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        user = get_user_by_id(pk)
        if user is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user_service.set_active(user, active=True)
        return Response({"detail": f"User {user.email} activated."})


class DeactivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        user = get_user_by_id(pk)
        if user is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if user.pk == request.user.pk:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_service.set_active(user, active=False)
        return Response({"detail": f"User {user.email} deactivated."})