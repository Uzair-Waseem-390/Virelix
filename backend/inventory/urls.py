"""
inventory/urls.py
──────────────────
All inventory URLs are nested under a project:
  /projects/<project_pk>/inventory/...
"""

from django.urls import path
from inventory import views

app_name = "inventory"

urlpatterns = [
    # ── Collection ────────────────────────────────────────────────────────────
    path("",                views.InventoryListCreateView.as_view(), name="list-create"),

    # ── Project-level reporting ───────────────────────────────────────────────
    path("movements/",      views.ProjectMovementsView.as_view(),    name="project-movements"),
    path("low-stock/",      views.LowStockView.as_view(),            name="low-stock"),
    path("out-of-stock/",   views.OutOfStockView.as_view(),          name="out-of-stock"),

    # ── Single inventory record ───────────────────────────────────────────────
    path("<int:pk>/",            views.InventoryDetailView.as_view(),    name="detail"),

    # ── Stock movements ───────────────────────────────────────────────────────
    path("<int:pk>/stock-in/",   views.StockInView.as_view(),           name="stock-in"),
    path("<int:pk>/stock-out/",  views.StockOutView.as_view(),          name="stock-out"),
    path("<int:pk>/adjust/",     views.StockAdjustView.as_view(),       name="adjust"),
    path("<int:pk>/movements/",  views.InventoryMovementsView.as_view(), name="movements"),
]