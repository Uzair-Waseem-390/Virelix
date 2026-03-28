"""
inventory/services/inventory_service.py
────────────────────────────────────────
All business logic for Inventory and StockMovement.
No HTTP, no serializers, no ORM queries.
"""

from __future__ import annotations
from typing import Optional

from django.db import transaction

from accounts.models import User
from inventory.models import Inventory, StockMovement, MovementType
from inventory.selectors.inventory_selector import (
    get_inventory_by_product,
)


# ── Create inventory record for a product ─────────────────────────────────────

def create_inventory(
    project,
    product,
    created_by:          User,
    quantity:            int = 0,
    low_stock_threshold: int = 10,
    location:            str = "",
) -> Inventory:
    """
    Create an inventory record for a product.
    One product can only have ONE inventory record (enforced by OneToOne).
    If one already exists, raises ValueError.
    """
    if get_inventory_by_product(product.pk) is not None:
        raise ValueError(
            f"An inventory record already exists for '{product.name}'. "
            "Use stock movements to adjust quantity."
        )
    if product.project_id != project.pk:
        raise ValueError("Product does not belong to this project.")

    _validate_quantity(quantity, "quantity")
    _validate_quantity(low_stock_threshold, "low_stock_threshold")

    with transaction.atomic():
        inventory = Inventory.objects.create(
            project             = project,
            product             = product,
            quantity            = quantity,
            low_stock_threshold = low_stock_threshold,
            location            = location.strip(),
        )
        # Record the initial stock-in if quantity > 0
        if quantity > 0:
            StockMovement.objects.create(
                inventory       = inventory,
                performed_by    = created_by,
                movement_type   = MovementType.STOCK_IN,
                quantity        = quantity,
                quantity_before = 0,
                quantity_after  = quantity,
                note            = "Initial stock.",
            )

    return inventory


# ── Update inventory settings (not quantity) ──────────────────────────────────

def update_inventory(
    inventory:           Inventory,
    low_stock_threshold: Optional[int] = None,
    location:            Optional[str] = None,
) -> Inventory:
    """
    Update inventory metadata: threshold and/or location.
    Quantity is NEVER changed here — use stock movements for that.
    """
    changed = []

    if low_stock_threshold is not None:
        _validate_quantity(low_stock_threshold, "low_stock_threshold")
        inventory.low_stock_threshold = low_stock_threshold
        changed.append("low_stock_threshold")

    if location is not None:
        inventory.location = location.strip()
        changed.append("location")

    if changed:
        inventory.save(update_fields=changed + ["updated_at"])

    return inventory


# ── Stock movements ────────────────────────────────────────────────────────────

def add_stock(
    inventory:   Inventory,
    performed_by: User,
    quantity:    int,
    note:        str = "",
) -> StockMovement:
    """
    Stock In — increase quantity.
    quantity must be > 0.
    """
    if quantity <= 0:
        raise ValueError("Stock-in quantity must be greater than 0.")

    with transaction.atomic():
        # Lock the row to prevent race conditions
        inv = Inventory.objects.select_for_update().get(pk=inventory.pk)
        before = inv.quantity
        after  = before + quantity

        inv.quantity = after
        inv.save(update_fields=["quantity", "updated_at"])

        movement = StockMovement.objects.create(
            inventory       = inv,
            performed_by    = performed_by,
            movement_type   = MovementType.STOCK_IN,
            quantity        = quantity,
            quantity_before = before,
            quantity_after  = after,
            note            = note.strip(),
        )

    # Refresh the inventory instance so caller gets updated quantity
    inventory.refresh_from_db()
    return movement


def remove_stock(
    inventory:    Inventory,
    performed_by: User,
    quantity:     int,
    note:         str = "",
) -> StockMovement:
    """
    Stock Out — decrease quantity.
    quantity must be > 0.
    Cannot go below 0 — raises ValueError.
    """
    if quantity <= 0:
        raise ValueError("Stock-out quantity must be greater than 0.")

    with transaction.atomic():
        inv = Inventory.objects.select_for_update().get(pk=inventory.pk)
        before = inv.quantity

        if quantity > before:
            raise ValueError(
                f"Insufficient stock. Available: {before}, requested: {quantity}."
            )

        after = before - quantity

        inv.quantity = after
        inv.save(update_fields=["quantity", "updated_at"])

        movement = StockMovement.objects.create(
            inventory       = inv,
            performed_by    = performed_by,
            movement_type   = MovementType.STOCK_OUT,
            quantity        = quantity,
            quantity_before = before,
            quantity_after  = after,
            note            = note.strip(),
        )

    inventory.refresh_from_db()
    return movement


def adjust_stock(
    inventory:    Inventory,
    performed_by: User,
    new_quantity: int,
    note:         str = "",
) -> StockMovement:
    """
    Manual adjustment — set quantity to an exact value.
    Use for stocktake corrections.
    new_quantity must be >= 0.
    """
    _validate_quantity(new_quantity, "new_quantity")

    with transaction.atomic():
        inv    = Inventory.objects.select_for_update().get(pk=inventory.pk)
        before = inv.quantity
        after  = new_quantity

        if before == after:
            raise ValueError("New quantity is the same as current quantity. No adjustment needed.")

        inv.quantity = after
        inv.save(update_fields=["quantity", "updated_at"])

        movement = StockMovement.objects.create(
            inventory       = inv,
            performed_by    = performed_by,
            movement_type   = MovementType.ADJUSTMENT,
            quantity        = abs(after - before),
            quantity_before = before,
            quantity_after  = after,
            note            = note.strip() or f"Manual adjustment from {before} to {after}.",
        )

    inventory.refresh_from_db()
    return movement


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_inventory(inventory: Inventory) -> None:
    """
    Hard-delete an inventory record and all its movements.
    Only admin/manager — enforced at view layer.
    Cascades: all StockMovement rows deleted automatically.
    """
    inventory.delete()


# ── Private helpers ───────────────────────────────────────────────────────────

def _validate_quantity(value: int, field_name: str) -> None:
    if not isinstance(value, int) or value < 0:
        raise ValueError(f"{field_name} must be a non-negative integer.")