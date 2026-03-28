"""
inventory/models.py
────────────────────
Two models:

  Inventory
    The current stock record for one product inside one project.
    One row per product (OneToOne with Product).
    quantity      — current stock level (never goes below 0)
    low_stock_threshold — alert level; if quantity <= this, stock is low
    location      — optional warehouse / shelf label

  StockMovement
    An immutable audit log of every stock change.
    Every time stock goes up or down a StockMovement row is created.
    This is the source of truth for history/auditing.
    The Inventory.quantity is always the sum of all movements for that product.

    movement_type choices:
      stock_in   — receiving goods (purchase, return from customer)
      stock_out  — dispatching goods (sale, damage, theft)
      adjustment — manual correction (stocktake discrepancy)

Design:
  - Inventory is CASCADE-deleted when its product is deleted.
  - StockMovement is CASCADE-deleted with Inventory.
  - quantity on Inventory is denormalised for fast reads.
    It is kept in sync by the service layer (never written directly).
  - quantity can never go below 0. Enforced at the service layer.
"""

from django.db import models
from django.conf import settings


class MovementType(models.TextChoices):
    STOCK_IN    = "stock_in",    "Stock In"
    STOCK_OUT   = "stock_out",   "Stock Out"
    ADJUSTMENT  = "adjustment",  "Adjustment"


class Inventory(models.Model):
    # ── Relations ─────────────────────────────────────────────────────────────
    project = models.ForeignKey(
        "projects.Project",
        on_delete    = models.CASCADE,
        related_name = "inventory_records",
    )
    product = models.OneToOneField(
        "products.Product",
        on_delete    = models.CASCADE,
        related_name = "inventory",
    )

    # ── Stock state ───────────────────────────────────────────────────────────
    quantity = models.PositiveIntegerField(
        default   = 0,
        help_text = "Current stock level. Always >= 0.",
    )
    low_stock_threshold = models.PositiveIntegerField(
        default   = 10,
        help_text = "Alert when quantity drops to or below this value.",
    )
    location = models.CharField(
        max_length = 150,
        blank      = True,
        default    = "",
        help_text  = "Warehouse / shelf / bin location. Optional.",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering        = ["product__name"]
        verbose_name    = "Inventory"
        verbose_name_plural = "Inventory"

    def __str__(self) -> str:
        return f"{self.product.name} — qty: {self.quantity} [{self.project.name}]"

    # ── Convenience ───────────────────────────────────────────────────────────

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.low_stock_threshold

    @property
    def is_out_of_stock(self) -> bool:
        return self.quantity == 0


class StockMovement(models.Model):
    # ── Relations ─────────────────────────────────────────────────────────────
    inventory = models.ForeignKey(
        Inventory,
        on_delete    = models.CASCADE,
        related_name = "movements",
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete    = models.SET_NULL,
        null         = True,
        blank        = True,
        related_name = "stock_movements",
    )

    # ── Movement fields ───────────────────────────────────────────────────────
    movement_type = models.CharField(
        max_length = 20,
        choices    = MovementType.choices,
    )
    quantity = models.PositiveIntegerField(
        help_text = "Units moved. Always positive; direction is set by movement_type.",
    )
    quantity_before = models.PositiveIntegerField(
        help_text = "Stock level before this movement (snapshot for audit).",
    )
    quantity_after = models.PositiveIntegerField(
        help_text = "Stock level after this movement (snapshot for audit).",
    )
    note = models.TextField(
        blank     = True,
        default   = "",
        help_text = "Optional reason or reference (e.g. PO number, sale ID).",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering     = ["-created_at"]
        verbose_name = "Stock Movement"
        verbose_name_plural = "Stock Movements"

    def __str__(self) -> str:
        return (
            f"{self.movement_type} | {self.inventory.product.name} | "
            f"qty: {self.quantity} | {self.created_at:%Y-%m-%d %H:%M}"
        )