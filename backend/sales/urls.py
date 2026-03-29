"""
sales/urls.py
──────────────
All sales URLs nested under a project:
  /projects/<project_pk>/sales/...
"""

from django.urls import path
from sales import views

app_name = "sales"

urlpatterns = [
    # ── Collection + summary ──────────────────────────────────────────────────
    path("",         views.SaleListCreateView.as_view(), name="list-create"),
    path("summary/", views.SalesSummaryView.as_view(),   name="summary"),

    # ── Single sale ───────────────────────────────────────────────────────────
    path("<int:pk>/",         views.SaleDetailView.as_view(),  name="detail"),
    path("<int:pk>/confirm/", views.SaleConfirmView.as_view(), name="confirm"),
    path("<int:pk>/cancel/",  views.SaleCancelView.as_view(),  name="cancel"),

    # ── Sale items ────────────────────────────────────────────────────────────
    path("<int:pk>/items/",                   views.SaleItemListView.as_view(),   name="item-list"),
    path("<int:pk>/items/<int:item_pk>/",     views.SaleItemDetailView.as_view(), name="item-detail"),
]