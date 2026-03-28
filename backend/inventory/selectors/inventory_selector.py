"""
inventory/selectors/inventory_selector.py
──────────────────────────────────────────
All read-only DB queries for Inventory and StockMovement.
Views and services import from here — never write raw ORM queries elsewhere.
"""

from __future__ import annotations
from typing import Optional
from django.db.models import QuerySet, Q

from inventory.models import Inventory, StockMovement


# ── Inventory ─────────────────────────────────────────────────────────────────

def get_inventory_by_id(inventory_id: int) -> Optional[Inventory]:
    return (
        Inventory.objects
        .select_related("product", "project")
        .filter(pk=inventory_id)
        .first()
    )


def get_inventory_by_product(product_id: int) -> Optional[Inventory]:
    """Fetch the inventory record for a specific product."""
    return (
        Inventory.objects
        .select_related("product", "project")
        .filter(product_id=product_id)
        .first()
    )


def get_inventory_for_project(project_id: int) -> QuerySet:
    """All inventory records for a project, ordered by product name."""
    return (
        Inventory.objects
        .select_related("product")
        .filter(project_id=project_id)
        .order_by("product__name")
    )


def get_low_stock_for_project(project_id: int) -> QuerySet:
    """
    All inventory records where quantity <= low_stock_threshold.
    Used for low-stock alerts.
    """
    from django.db.models import F
    return (
        Inventory.objects
        .select_related("product")
        .filter(project_id=project_id, quantity__lte=F("low_stock_threshold"))
        .order_by("quantity")
    )


def get_out_of_stock_for_project(project_id: int) -> QuerySet:
    """All inventory records with quantity == 0."""
    return (
        Inventory.objects
        .select_related("product")
        .filter(project_id=project_id, quantity=0)
        .order_by("product__name")
    )


def search_inventory_for_project(project_id: int, query: str) -> QuerySet:
    """Search inventory by product name, SKU, or location."""
    return (
        Inventory.objects
        .select_related("product")
        .filter(project_id=project_id)
        .filter(
            Q(product__name__icontains=query)
            | Q(product__sku__icontains=query)
            | Q(location__icontains=query)
            | Q(product__category__icontains=query)
        )
        .order_by("product__name")
    )


def inventory_belongs_to_project(inventory: Inventory, project_id: int) -> bool:
    return inventory.project_id == project_id


# ── StockMovement ─────────────────────────────────────────────────────────────

def get_movements_for_inventory(
    inventory_id: int,
    movement_type: Optional[str] = None,
) -> QuerySet:
    """
    All stock movements for an inventory record, newest first.
    Optionally filter by movement_type (stock_in / stock_out / adjustment).
    """
    qs = (
        StockMovement.objects
        .select_related("performed_by")
        .filter(inventory_id=inventory_id)
        .order_by("-created_at")
    )
    if movement_type:
        qs = qs.filter(movement_type=movement_type)
    return qs


def get_movements_for_project(
    project_id: int,
    movement_type: Optional[str] = None,
) -> QuerySet:
    """All stock movements across all products in a project, newest first."""
    qs = (
        StockMovement.objects
        .select_related("inventory__product", "performed_by")
        .filter(inventory__project_id=project_id)
        .order_by("-created_at")
    )
    if movement_type:
        qs = qs.filter(movement_type=movement_type)
    return qs