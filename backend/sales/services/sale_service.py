"""
sales/services/sale_service.py
───────────────────────────────
All business logic for Sales.
No HTTP, no serializers, no raw ORM queries.

Workflow:
  1. create_sale()          → creates a DRAFT sale
  2. add_item_to_sale()     → adds a product line to the draft
  3. update_sale_item()     → changes qty on a line
  4. remove_item_from_sale()→ removes a line
  5. confirm_sale()         → sets status=confirmed, decrements inventory
  6. cancel_sale()          → sets status=cancelled, restores inventory
  7. delete_sale()          → hard-delete DRAFT only (admin/manager)

Inventory integration:
  - confirm_sale() calls inventory's remove_stock() for each item.
    If ANY product has insufficient stock the whole transaction is rolled back.
  - cancel_sale() calls inventory's add_stock() to restore every item.
  - Both use select_for_update() inside inventory_service, so concurrent
    confirmations of the same product are safe.
"""

from __future__ import annotations
from typing import Optional
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from accounts.models import User
from products.models import Product
from sales.models import Sale, SaleItem, SaleStatus
from sales.selectors.sale_selector import get_sale_item_by_id


# ── Create ────────────────────────────────────────────────────────────────────

def create_sale(
    project,
    created_by:     User,
    customer_name:  str = "",
    customer_phone: str = "",
    note:           str = "",
) -> Sale:
    """Create a new DRAFT sale. No items yet."""
    return Sale.objects.create(
        project        = project,
        created_by     = created_by,
        customer_name  = customer_name.strip(),
        customer_phone = customer_phone.strip(),
        note           = note.strip(),
        status         = SaleStatus.DRAFT,
        total_amount   = Decimal("0.00"),
    )


# ── Update sale header ────────────────────────────────────────────────────────

def update_sale(
    sale:           Sale,
    customer_name:  Optional[str] = None,
    customer_phone: Optional[str] = None,
    note:           Optional[str] = None,
) -> Sale:
    """
    Update draft sale header fields.
    Raises ValueError if sale is not in draft status.
    """
    _assert_editable(sale)
    changed = []

    if customer_name is not None:
        sale.customer_name = customer_name.strip()
        changed.append("customer_name")

    if customer_phone is not None:
        sale.customer_phone = customer_phone.strip()
        changed.append("customer_phone")

    if note is not None:
        sale.note = note.strip()
        changed.append("note")

    if changed:
        sale.save(update_fields=changed + ["updated_at"])

    return sale


# ── Sale items ────────────────────────────────────────────────────────────────

def add_item_to_sale(
    sale:      Sale,
    product:   Product,
    quantity:  int,
    unit_price: Optional[Decimal] = None,
) -> SaleItem:
    """
    Add a product line to a draft sale.
    - If the product is already on the sale, raises ValueError
      (use update_sale_item instead).
    - unit_price defaults to product.price if not provided.
    - Validates quantity > 0.
    - Does NOT check inventory — inventory is only checked on confirm.
    """
    _assert_editable(sale)

    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0.")

    # Use product's current price as default snapshot
    price = Decimal(str(unit_price)) if unit_price is not None else product.price
    if price < 0:
        raise ValueError("Unit price cannot be negative.")

    total = price * quantity

    with transaction.atomic():
        # Check uniqueness — one product per sale
        if SaleItem.objects.filter(sale=sale, product=product).exists():
            raise ValueError(
                f"'{product.name}' is already on this sale. "
                "Use update item to change the quantity."
            )

        item = SaleItem.objects.create(
            sale        = sale,
            product     = product,
            quantity    = quantity,
            unit_price  = price,
            total_price = total,
        )
        _recalculate_total(sale)

    return item


def update_sale_item(
    item:      SaleItem,
    quantity:  Optional[int]     = None,
    unit_price: Optional[Decimal] = None,
) -> SaleItem:
    """
    Update quantity and/or unit_price of a sale item.
    Only allowed on draft sales.
    """
    _assert_editable(item.sale)

    changed = []

    if quantity is not None:
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0.")
        item.quantity = quantity
        changed.append("quantity")

    if unit_price is not None:
        price = Decimal(str(unit_price))
        if price < 0:
            raise ValueError("Unit price cannot be negative.")
        item.unit_price = price
        changed.append("unit_price")

    if changed:
        item.total_price = item.unit_price * item.quantity
        changed.append("total_price")
        item.save(update_fields=changed + ["updated_at"])
        _recalculate_total(item.sale)

    return item


def remove_item_from_sale(item: SaleItem) -> None:
    """Remove a line from a draft sale."""
    _assert_editable(item.sale)
    sale = item.sale
    item.delete()
    _recalculate_total(sale)


# ── Confirm ───────────────────────────────────────────────────────────────────

def confirm_sale(sale: Sale, confirmed_by: User) -> Sale:
    """
    Confirm a draft sale:
      1. Validate it has at least one item.
      2. Decrement inventory for each item (atomic — all or nothing).
      3. Set status = confirmed.

    Raises ValueError if:
      - Sale is not in draft status.
      - Sale has no items.
      - Any product has insufficient inventory.
      - Any product has no inventory record at all.
    """
    _assert_editable(sale)

    items = list(sale.items.select_related("product").all())
    if not items:
        raise ValueError("Cannot confirm a sale with no items.")

    with transaction.atomic():
        for item in items:
            _deduct_inventory(item, performed_by=confirmed_by)

        sale.status       = SaleStatus.CONFIRMED
        sale.confirmed_at = timezone.now()
        sale.save(update_fields=["status", "confirmed_at", "updated_at"])

    return sale


# ── Cancel ────────────────────────────────────────────────────────────────────

def cancel_sale(sale: Sale, cancelled_by: User) -> Sale:
    """
    Cancel a draft or confirmed sale:
      - If confirmed: restore inventory for each item.
      - If draft: simply cancel (no inventory to restore).
      - If already cancelled: raises ValueError.
    """
    if sale.is_cancelled:
        raise ValueError("Sale is already cancelled.")

    with transaction.atomic():
        if sale.is_confirmed:
            items = list(sale.items.select_related("product").all())
            for item in items:
                _restore_inventory(item, performed_by=cancelled_by)

        sale.status       = SaleStatus.CANCELLED
        sale.cancelled_at = timezone.now()
        sale.save(update_fields=["status", "cancelled_at", "updated_at"])

    return sale


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_sale(sale: Sale) -> None:
    """
    Hard-delete a sale. Only DRAFT sales can be deleted.
    Confirmed/cancelled sales are permanent records — they cannot be deleted.
    Only admin/manager — enforced at view layer.
    """
    if not sale.is_editable:
        raise ValueError(
            f"Cannot delete a {sale.status} sale. "
            "Only draft sales can be permanently deleted."
        )
    sale.delete()


# ── Private helpers ───────────────────────────────────────────────────────────

def _assert_editable(sale: Sale) -> None:
    """Raise ValueError if sale is not in draft status."""
    if not sale.is_editable:
        raise ValueError(
            f"Sale is {sale.status}. Only draft sales can be modified."
        )


def _recalculate_total(sale: Sale) -> None:
    """Recompute sale.total_amount from its items and save."""
    from django.db.models import Sum
    result = SaleItem.objects.filter(sale=sale).aggregate(total=Sum("total_price"))
    sale.total_amount = result["total"] or Decimal("0.00")
    sale.save(update_fields=["total_amount", "updated_at"])


def _deduct_inventory(item: SaleItem, performed_by: User) -> None:
    """
    Deduct stock for one sale item.
    Raises ValueError if no inventory record or insufficient stock.
    Must be called inside an atomic block.
    """
    from inventory.selectors.inventory_selector import get_inventory_by_product
    from inventory.services.inventory_service import remove_stock

    inventory = get_inventory_by_product(item.product_id)
    if inventory is None:
        raise ValueError(
            f"No inventory record found for '{item.product.name}'. "
            "Create an inventory record before confirming sales."
        )

    # remove_stock handles the select_for_update lock + ValueError on insufficient stock
    remove_stock(
        inventory    = inventory,
        performed_by = performed_by,
        quantity     = item.quantity,
        note         = f"Sale #{item.sale_id} confirmed.",
    )


def _restore_inventory(item: SaleItem, performed_by: User) -> None:
    """
    Restore stock for one sale item on cancellation.
    If no inventory record exists, logs a warning and skips silently
    (the inventory record may have been deleted after the sale).
    Must be called inside an atomic block.
    """
    import logging
    logger = logging.getLogger(__name__)

    from inventory.selectors.inventory_selector import get_inventory_by_product
    from inventory.services.inventory_service import add_stock

    inventory = get_inventory_by_product(item.product_id)
    if inventory is None:
        logger.warning(
            "Cannot restore inventory for product %s (sale #%s) — "
            "no inventory record found.",
            item.product_id, item.sale_id,
        )
        return

    add_stock(
        inventory    = inventory,
        performed_by = performed_by,
        quantity     = item.quantity,
        note         = f"Sale #{item.sale_id} cancelled — stock restored.",
    )