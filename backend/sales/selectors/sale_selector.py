"""
sales/selectors/sale_selector.py
──────────────────────────────────
All read-only DB queries for Sale and SaleItem.
Views and services import from here — never write raw ORM queries elsewhere.
"""

from __future__ import annotations
from typing import Optional
from django.db.models import QuerySet, Q, Sum
from django.utils import timezone

from sales.models import Sale, SaleItem, SaleStatus


# ── Sale ──────────────────────────────────────────────────────────────────────

def get_sale_by_id(sale_id: int) -> Optional[Sale]:
    return (
        Sale.objects
        .select_related("project", "created_by")
        .prefetch_related("items__product")
        .filter(pk=sale_id)
        .first()
    )


def get_sales_for_project(
    project_id: int,
    status: Optional[str] = None,
) -> QuerySet:
    """
    All sales for a project, newest first.
    Optionally filter by status: draft | confirmed | cancelled
    """
    qs = (
        Sale.objects
        .select_related("created_by")
        .prefetch_related("items__product")
        .filter(project_id=project_id)
        .order_by("-created_at")
    )
    if status:
        qs = qs.filter(status=status)
    return qs


def search_sales_for_project(project_id: int, query: str) -> QuerySet:
    """Search sales by customer name, phone, or note."""
    return (
        Sale.objects
        .select_related("created_by")
        .prefetch_related("items__product")
        .filter(project_id=project_id)
        .filter(
            Q(customer_name__icontains=query)
            | Q(customer_phone__icontains=query)
            | Q(note__icontains=query)
        )
        .order_by("-created_at")
    )


def get_sale_item_by_id(item_id: int) -> Optional[SaleItem]:
    return (
        SaleItem.objects
        .select_related("sale", "product")
        .filter(pk=item_id)
        .first()
    )


def sale_belongs_to_project(sale: Sale, project_id: int) -> bool:
    return sale.project_id == project_id


def sale_item_belongs_to_sale(item: SaleItem, sale_id: int) -> bool:
    return item.sale_id == sale_id


# ── Summary / reporting ───────────────────────────────────────────────────────

def get_sales_summary_for_project(project_id: int) -> dict:
    """
    Aggregate totals for confirmed sales only.
    Returns dict with total_sales count and total_revenue.
    """
    from django.db.models import Count
    result = (
        Sale.objects
        .filter(project_id=project_id, status=SaleStatus.CONFIRMED)
        .aggregate(
            total_sales   = Count("id"),
            total_revenue = Sum("total_amount"),
        )
    )
    return {
        "total_confirmed_sales": result["total_sales"] or 0,
        "total_revenue":         result["total_revenue"] or 0,
    }