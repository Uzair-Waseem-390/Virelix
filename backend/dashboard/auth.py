"""
dashboard/auth.py
──────────────────
Custom JWT login view that enriches the standard token response
with role and redirect information.

After login the frontend reads:
  {
      "access":        "...",
      "refresh":       "...",
      "role":          "admin" | "manager" | "staff",
      "redirect_to":   "/dashboard/"              (admin)
                    or "/dashboard/projects/<id>/" (manager/staff),
      "project_id":    null | <int>               (null for admin)
  }

The frontend then navigates to redirect_to immediately.
For admin:   calls GET /dashboard/ to load the main dashboard
For others:  calls GET /dashboard/projects/<id>/ directly
"""

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status as http_status

from accounts.models import Role


class VorelixTokenSerializer(TokenObtainPairSerializer):
    """Adds role + redirect_to to the default JWT response."""

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user

        # Determine where this user should land after login
        if user.role == Role.ADMIN:
            redirect_to = "/dashboard/"
            project_id  = None
        else:
            # Manager or Staff — find their project
            from projects.selectors.project_selector import get_project_for_member
            project = get_project_for_member(user)
            if project:
                redirect_to = f"/dashboard/projects/{project.pk}/"
                project_id  = project.pk
            else:
                redirect_to = "/dashboard/"
                project_id  = None

        data["role"]        = user.role
        data["redirect_to"] = redirect_to
        data["project_id"]  = project_id

        return data


class VorelixLoginView(TokenObtainPairView):
    """
    POST /auth/login/
    Drop-in replacement for TokenObtainPairView.
    Returns access + refresh tokens plus role-aware redirect info.
    """
    serializer_class = VorelixTokenSerializer