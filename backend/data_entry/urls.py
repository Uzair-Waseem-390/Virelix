from django.urls import path
from data_entry import views

app_name = "data_entry"

urlpatterns = [
    # ── Password gate ─────────────────────────────────────────────────────────
    path("verify-password/",    views.VerifyPasswordView.as_view(),     name="verify-password"),

    # ── Dropdown data ──────────────────────────────────────────────────────────
    path("users/",              views.ListUsersView.as_view(),           name="users"),
    path("projects/",           views.ListProjectsView.as_view(),        name="projects"),
    path("project-members/",    views.ListProjectMembersView.as_view(),  name="project-members"),

    # ── Main action ───────────────────────────────────────────────────────────
    path("generate/",           views.GenerateDataView.as_view(),        name="generate"),

    # ── History / status polling ──────────────────────────────────────────────
    path("history/",            views.DataEntryHistoryView.as_view(),    name="history"),
]
