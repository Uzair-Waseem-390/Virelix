"""
products/urls.py
─────────────────
All product URLs are nested under a project:
  /projects/<project_pk>/products/...

project_pk is passed from the parent urlconf via include().
"""

from django.urls import path
from products import views

app_name = "products"

urlpatterns = [
    # List + Create
    path(
        "",
        views.ProductListCreateView.as_view(),
        name="list-create",
    ),
    # Detail + Update + Hard Delete
    path(
        "<int:pk>/",
        views.ProductDetailView.as_view(),
        name="detail",
    ),
    # Soft delete / restore
    path(
        "<int:pk>/activate/",
        views.ProductActivateView.as_view(),
        name="activate",
    ),
    path(
        "<int:pk>/deactivate/",
        views.ProductDeactivateView.as_view(),
        name="deactivate",
    ),
]