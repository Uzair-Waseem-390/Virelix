"""
products/services/product_service.py
──────────────────────────────────────
All business logic for Product CRUD.
No HTTP, no serializers, no ORM queries (those live in selectors).
"""

from __future__ import annotations
from typing import Optional
from decimal import Decimal

from django.db import transaction

from accounts.models import User, Role
from products.models import Product
from products.selectors.product_selector import (
    get_product_by_id,
    get_product_by_sku,
    product_belongs_to_project,
)


# ── Create ────────────────────────────────────────────────────────────────────

def create_product(
    project,
    created_by: User,
    name: str,
    price: Decimal,
    description: str  = "",
    sku: str          = "",
    cost_price        = None,
    unit: str         = "piece",
    category: str     = "",
) -> Product:
    """
    Create a new product scoped to a project.
    Validates:
      - SKU uniqueness within the project (if SKU provided)
      - Price must be >= 0
      - cost_price must be >= 0 if provided
    """
    _validate_price(price, "price")
    if cost_price is not None:
        _validate_price(cost_price, "cost_price")

    sku = sku.strip()
    if sku:
        _assert_sku_unique(project.pk, sku, exclude_product_id=None)

    product = Product.objects.create(
        project     = project,
        created_by  = created_by,
        name        = name.strip(),
        description = description.strip(),
        sku         = sku,
        price       = price,
        cost_price  = cost_price,
        unit        = unit.strip() or "piece",
        category    = category.strip(),
    )
    return product


# ── Update ────────────────────────────────────────────────────────────────────

def update_product(
    product: Product,
    name: Optional[str]        = None,
    description: Optional[str] = None,
    sku: Optional[str]         = None,
    price                      = None,
    cost_price                 = None,
    unit: Optional[str]        = None,
    category: Optional[str]    = None,
) -> Product:
    """
    Partial update. Only provided (non-None) fields are changed.
    Re-validates SKU uniqueness if SKU is being changed.
    """
    changed = []

    if name is not None:
        product.name = name.strip()
        changed.append("name")

    if description is not None:
        product.description = description.strip()
        changed.append("description")

    if sku is not None:
        sku = sku.strip()
        if sku != product.sku:
            if sku:
                _assert_sku_unique(product.project_id, sku, exclude_product_id=product.pk)
            product.sku = sku
            changed.append("sku")

    if price is not None:
        _validate_price(price, "price")
        product.price = price
        changed.append("price")

    if cost_price is not None:
        _validate_price(cost_price, "cost_price")
        product.cost_price = cost_price
        changed.append("cost_price")

    if unit is not None:
        product.unit = unit.strip() or "piece"
        changed.append("unit")

    if category is not None:
        product.category = category.strip()
        changed.append("category")

    if changed:
        product.save(update_fields=changed + ["updated_at"])
    return product


# ── Activate / Deactivate (soft delete) ──────────────────────────────────────

def set_product_active(product: Product, *, active: bool) -> Product:
    """Soft-delete (deactivate) or restore a product."""
    product.is_active = active
    product.save(update_fields=["is_active", "updated_at"])
    return product


# ── Hard delete ───────────────────────────────────────────────────────────────

def delete_product(product: Product) -> None:
    """
    Permanently delete a product.
    Only admin and manager are allowed — enforced at the view layer.
    """
    product.delete()


# ── Private helpers ───────────────────────────────────────────────────────────

def _validate_price(value, field_name: str) -> None:
    try:
        value = Decimal(str(value))
    except Exception:
        raise ValueError(f"{field_name} must be a valid number.")
    if value < 0:
        raise ValueError(f"{field_name} cannot be negative.")


def _assert_sku_unique(project_id: int, sku: str, exclude_product_id: Optional[int]) -> None:
    """Raise ValueError if SKU is already in use within the project."""
    qs = Product.objects.filter(project_id=project_id, sku=sku)
    if exclude_product_id is not None:
        qs = qs.exclude(pk=exclude_product_id)
    if qs.exists():
        raise ValueError(f"SKU '{sku}' is already used by another product in this project.")