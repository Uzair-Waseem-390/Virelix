from django.urls import path

from accounts import views

app_name = "accounts"

urlpatterns = [
    # ── Public ──────────────────────────────────────────────────────
    path("register/",          views.RegisterView.as_view(),        name="register"),

    # ── Authenticated user (self) ────────────────────────────────────
    path("me/",                views.MeView.as_view(),              name="me"),
    path("me/profile/",        views.MeProfileView.as_view(),       name="me-profile"),
    path("me/delete/",         views.MeDeleteView.as_view(),        name="me-delete"),
    path("me/change-password/",views.ChangePasswordView.as_view(),  name="change-password"),

    # ── Admin: list / detail / activate / deactivate ────────────────
    # path("users/",             views.UserListView.as_view(),        name="user-list"),
    # path("users/<int:pk>/",    views.UserDetailView.as_view(),      name="user-detail"),
    # path("users/<int:pk>/activate/",   views.ActivateUserView.as_view(),   name="user-activate"),
    # path("users/<int:pk>/deactivate/", views.DeactivateUserView.as_view(), name="user-deactivate"),
]