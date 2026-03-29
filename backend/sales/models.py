"""
sales/models.py
────────────────
Two models:

  Sale
    A sales transaction header. One sale per customer visit / order.
    Tracks:
      - status     : draft → confirmed → cancelled
      - customer_name / customer_phone : optional, free-text
      - note       : optional reference or remarks
      - total_amount : denormalised sum of all SaleItem totals (kept in sync
                       by the service layer after every item add/remove)

    Status rules:
      draft      → items can be added/removed, sale can be confirmed or cancelled
      confirmed  → immutable; inventory has been decremented
      cancelled  → immutable; inventory has been restored

  SaleItem
    One line on a sale. Links a Product to a Sale.
    quantity    : how many units
    unit_price  : price snapshot at time of sale (Product.price may change later)
    total_price : unit_price × quantity (denormalised for fast reads)

Design:
  - Sale is CASCADE-deleted when its project is deleted.
  - SaleItem is CASCADE-deleted when its Sale is deleted.
  - Inventory is decremented ONLY when a sale is confirmed, not when items
    are added. This lets staff build a draft without touching stock.
  - Cancellation restores inventory via stock_in movement (audit trail kept).
  - unit_price is a snapshot — changing a product's price later does NOT
    retroactively change past sales.
"""

from django.db import models
from django.conf import settings


class SaleStatus(models.TextChoices):
    DRAFT     = "draft",     "Draft"
    CONFIRMED = "confirmed", "Confirmed"
    CANCELLED = "cancelled", "Cancelled"


class Sale(models.Model):
    # ── Relations ─────────────────────────────────────────────────────────────
    project = models.ForeignKey(
        "projects.Project",
        on_delete    = models.CASCADE,
        related_name = "sales",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete    = models.SET_NULL,
        null         = True,
        blank        = True,
        related_name = "created_sales",
    )

    # ── Customer info (optional) ──────────────────────────────────────────────
    customer_name  = models.CharField(max_length=200, blank=True, default="")
    customer_phone = models.CharField(max_length=50,  blank=True, default="")

    # ── Status & totals ───────────────────────────────────────────────────────
    status = models.CharField(
        max_length = 20,
        choices    = SaleStatus.choices,
        default    = SaleStatus.DRAFT,
    )
    total_amount = models.DecimalField(
        max_digits     = 12,
        decimal_places = 2,
        default        = 0,
        help_text      = "Denormalised sum of all SaleItem totals. Updated by service.",
    )
    note = models.TextField(blank=True, default="")

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering        = ["-created_at"]
        verbose_name    = "Sale"
        verbose_name_plural = "Sales"

    def __str__(self) -> str:
        label = self.customer_name or f"Sale #{self.pk}"
        return f"{label} [{self.project.name}] — {self.status}"

    # ── Convenience ───────────────────────────────────────────────────────────

    @property
    def is_editable(self) -> bool:
        """Only draft sales can be modified."""
        return self.status == SaleStatus.DRAFT

    @property
    def is_confirmed(self) -> bool:
        return self.status == SaleStatus.CONFIRMED

    @property
    def is_cancelled(self) -> bool:
        return self.status == SaleStatus.CANCELLED


class SaleItem(models.Model):
    # ── Relations ─────────────────────────────────────────────────────────────
    sale = models.ForeignKey(
        Sale,
        on_delete    = models.CASCADE,
        related_name = "items",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete    = models.PROTECT,  # prevent deleting a product that has sales
        related_name = "sale_items",
    )

    # ── Line fields ───────────────────────────────────────────────────────────
    quantity    = models.PositiveIntegerField()
    unit_price  = models.DecimalField(
        max_digits     = 10,
        decimal_places = 2,
        help_text      = "Price snapshot at time of sale.",
    )
    total_price = models.DecimalField(
        max_digits     = 12,
        decimal_places = 2,
        help_text      = "unit_price × quantity (denormalised).",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering        = ["created_at"]
        verbose_name    = "Sale Item"
        verbose_name_plural = "Sale Items"
        # One product can appear only once per sale — use update qty instead
        constraints = [
            models.UniqueConstraint(
                fields = ["sale", "product"],
                name   = "unique_product_per_sale",
            )
        ]

    def __str__(self) -> str:
        return f"{self.product.name} × {self.quantity} @ {self.unit_price}"