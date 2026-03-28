"""
products/selectors/product_selector.py
────────────────────────────────────────
All read-only DB queries for Product.
Views and services import from here — never write raw ORM queries elsewhere.
"""

from __future__ import annotations
from typing import Optional
from django.db.models import QuerySet, Q

from products.models import Product


def get_product_by_id(product_id: int) -> Optional[Product]:
    """Fetch a single product by PK, with related objects pre-loaded."""
    return (
        Product.objects
        .select_related("project", "created_by")
        .filter(pk=product_id)
        .first()
    )


def get_active_products_for_project(project_id: int) -> QuerySet:
    """Only active (is_active=True) products. Default listing."""
    return (
        Product.objects
        .select_related("created_by")
        .filter(project_id=project_id, is_active=True)
        .order_by("name")
    )


def get_inactive_products_for_project(project_id: int) -> QuerySet:
    """Only inactive (soft-deleted) products. Admin/manager only."""
    return (
        Product.objects
        .select_related("created_by")
        .filter(project_id=project_id, is_active=False)
        .order_by("name")
    )


def get_all_products_for_project(project_id: int) -> QuerySet:
    """All products regardless of active status. Admin/manager only."""
    return (
        Product.objects
        .select_related("created_by")
        .filter(project_id=project_id)
        .order_by("name")
    )


def search_products_for_project(
    project_id: int,
    query: str,
    active_only: bool = True,
) -> QuerySet:
    """
    Search products by name, SKU, category, or description within a project.
    active_only=True  -> search only active products (default)
    active_only=False -> search across all products including inactive
    """
    if active_only:
        qs = get_active_products_for_project(project_id)
    else:
        qs = get_all_products_for_project(project_id)

    return qs.filter(
        Q(name__icontains=query)
        | Q(sku__icontains=query)
        | Q(category__icontains=query)
        | Q(description__icontains=query)
    )


def get_product_by_sku(project_id: int, sku: str) -> Optional[Product]:
    """Find a product by SKU within a project. SKU is project-scoped."""
    if not sku:
        return None
    return Product.objects.filter(project_id=project_id, sku=sku).first()


def product_belongs_to_project(product: Product, project_id: int) -> bool:
    """Confirm a product is scoped to the given project."""
    return product.project_id == project_id