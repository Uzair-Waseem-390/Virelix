from django.urls import path
from dashboard import views

app_name = "dashboard"

urlpatterns = [
    # Main entry point — role-aware, used immediately after login
    path("",                          views.MainDashboardView.as_view(),   name="main"),

    # Project-specific dashboard (admin entering a project, or manager/staff landing)
    path("projects/<int:project_pk>/", views.ProjectDashboardView.as_view(), name="project"),
]