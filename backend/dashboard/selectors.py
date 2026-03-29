"""
dashboard/selectors.py
───────────────────────
Aggregate DB queries for dashboard views.
These are the ONLY new queries needed — everything else reuses existing selectors.

Both functions work across multiple project IDs so the frontend gets
all data in ONE request instead of N requests (one per project).
"""

from __future__ import annotations
from django.db.models import Count, Sum, F, Q

from accounts.models import User
from projects.models import Project


def get_admin_dashboard_data(admin_user: User) -> dict:
    """
    Single DB-efficient aggregate for the admin main dashboard.
    Covers ALL projects owned by this admin.

    Returns a dict with:
      projects          : list of project summaries (id, name, ai_status, enabled_modules)
      total_products    : count of active products across all projects
      low_stock_items   : list of inventory records where qty <= threshold (all projects)
      out_of_stock_items: list of inventory records where qty == 0 (all projects)
      total_confirmed_sales : count of confirmed sales across all projects
      total_draft_sales     : count of draft sales across all projects
      total_revenue         : sum of confirmed sale amounts across all projects
    """
    from products.models import Product
    from inventory.models import Inventory
    from sales.models import Sale, SaleStatus

    # All project IDs for this admin — single query, reused below
    project_ids = list(
        Project.objects.filter(admin=admin_user).values_list("id", flat=True)
    )

    if not project_ids:
        return {
            "projects":             [],
            "total_products":       0,
            "low_stock_items":      [],
            "out_of_stock_items":   [],
            "total_confirmed_sales": 0,
            "total_draft_sales":    0,
            "total_revenue":        "0.00",
        }

    # ── Projects summary ──────────────────────────────────────────────────────
    projects = (
        Project.objects
        .filter(id__in=project_ids)
        .select_related("manager", "staff")
        .order_by("-created_at")
    )

    # ── Product count (active only) ───────────────────────────────────────────
    total_products = Product.objects.filter(
        project_id__in=project_ids, is_active=True
    ).count()

    # ── Low stock (qty <= threshold, across all projects) ─────────────────────
    low_stock_items = (
        Inventory.objects
        .select_related("product", "project")
        .filter(project_id__in=project_ids, quantity__lte=F("low_stock_threshold"))
        .order_by("quantity")
    )

    # ── Out of stock ──────────────────────────────────────────────────────────
    out_of_stock_items = (
        Inventory.objects
        .select_related("product", "project")
        .filter(project_id__in=project_ids, quantity=0)
        .order_by("product__name")
    )

    # ── Sales aggregates ──────────────────────────────────────────────────────
    sales_agg = (
        Sale.objects
        .filter(project_id__in=project_ids)
        .aggregate(
            total_confirmed = Count("id", filter=Q(status=SaleStatus.CONFIRMED)),
            total_draft     = Count("id", filter=Q(status=SaleStatus.DRAFT)),
            total_revenue   = Sum(
                "total_amount",
                filter=Q(status=SaleStatus.CONFIRMED),
            ),
        )
    )

    return {
        "projects":              projects,
        "total_products":        total_products,
        "low_stock_items":       low_stock_items,
        "out_of_stock_items":    out_of_stock_items,
        "total_confirmed_sales": sales_agg["total_confirmed"] or 0,
        "total_draft_sales":     sales_agg["total_draft"]     or 0,
        "total_revenue":         str(sales_agg["total_revenue"] or "0.00"),
    }


def get_project_dashboard_data(project: Project) -> dict:
    """
    Single-project aggregate for the project-specific dashboard.
    Used by manager and staff (and admin when they enter a specific project).

    Returns:
      project         : project info + enabled_modules (for sidebar)
      total_products  : active product count
      low_stock_items : low-stock inventory for this project
      out_of_stock_items: out-of-stock inventory
      total_confirmed_sales
      total_draft_sales
      total_revenue
    """
    from products.models import Product
    from inventory.models import Inventory
    from sales.models import Sale, SaleStatus

    pid = project.pk

    total_products = Product.objects.filter(
        project_id=pid, is_active=True
    ).count()

    low_stock_items = (
        Inventory.objects
        .select_related("product")
        .filter(project_id=pid, quantity__lte=F("low_stock_threshold"))
        .order_by("quantity")
    )

    out_of_stock_items = (
        Inventory.objects
        .select_related("product")
        .filter(project_id=pid, quantity=0)
        .order_by("product__name")
    )

    sales_agg = (
        Sale.objects
        .filter(project_id=pid)
        .aggregate(
            total_confirmed = Count("id", filter=Q(status=SaleStatus.CONFIRMED)),
            total_draft     = Count("id", filter=Q(status=SaleStatus.DRAFT)),
            total_revenue   = Sum(
                "total_amount",
                filter=Q(status=SaleStatus.CONFIRMED),
            ),
        )
    )

    return {
        "project":               project,
        "total_products":        total_products,
        "low_stock_items":       low_stock_items,
        "out_of_stock_items":    out_of_stock_items,
        "total_confirmed_sales": sales_agg["total_confirmed"] or 0,
        "total_draft_sales":     sales_agg["total_draft"]     or 0,
        "total_revenue":         str(sales_agg["total_revenue"] or "0.00"),
    }