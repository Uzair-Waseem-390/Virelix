from django.urls import path
from projects import views

app_name = "projects"

urlpatterns = [
    # ── Collection ────────────────────────────────────────────────────────────
    path("",                             views.ProjectListCreateView.as_view(), name="list-create"),

    # ── Single project ─────────────────────────────────────────────────────────
    path("<int:pk>/",                    views.ProjectDetailView.as_view(),     name="detail"),
    path("<int:pk>/dashboard/",          views.ProjectDashboardView.as_view(),  name="dashboard"),
    path("<int:pk>/ai-status/",          views.ProjectAIStatusView.as_view(),   name="ai-status"),

    # ── Member credential management (admin only) ──────────────────────────────
    path("<int:pk>/manager/",            views.UpdateManagerView.as_view(),     name="update-manager"),
    path("<int:pk>/staff/",              views.UpdateStaffView.as_view(),       name="update-staff"),
]


# project 13
# "email": "manager.db6754@test.demo",  28
# ava123123
# "email": "staff.db6754@test.demo",  29
# {
#     "task_id": null,
#     "project": {
#         "id": 3,
#         "name": "test",
#         "description": "i want a simple ERP system",
#         "admin_email": "uzair@gmail.com",
#         "manager_details": {
#             "id": 8,
#             "email": "manager.f74b04@test.demo",
#             "role": "manager",
#             "is_active": true,
#             "created_at": "2026-03-27T21:35:40.642103Z"
#         },
#         "staff_details": {
#             "id": 9,
#             "email": "staff.f74b04@test.demo",
#             "role": "staff",
#             "is_active": true,
#             "created_at": "2026-03-27T21:35:43.315548Z"
#         },
#         "ai_status": "pending",
#         "ai_error": "",
#         "has_products": false,
#         "has_inventory": false,
#         "has_sales": false,
#         "enabled_modules": [],
#         "created_at": "2026-03-27T21:35:38.715869Z",
#         "updated_at": "2026-03-27T21:35:38.715916Z"
#     },
#     "ai_warning": "AI task could not be dispatched: [WinError 10061] No connection could be made because the target machine actively refused it"
# }