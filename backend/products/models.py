"""
products/models.py
───────────────────
Product model — scoped entirely to a Project.

Design decisions:
  - project : FK to Project. Products are isolated per-project.
              on_delete=CASCADE means all products are deleted when
              their project is deleted. No orphaned products.

  - created_by : FK to User. Tracks who created the product.
                 on_delete=SET_NULL so products survive if a user is
                 deactivated (manager/staff deletion only happens via
                 project deletion anyway, which cascades products too).

  - price : DecimalField with 10 digits, 2 decimal places.
            Stored as Decimal, never float (float arithmetic is lossy
            for currency values).

  - sku   : Optional stock-keeping unit. Unique within a project
            (two different projects can have the same SKU). Enforced
            via unique_together on (project, sku).

  - is_active : Soft-delete flag. Inactive products are excluded from
                default querysets but kept in the DB for audit/history.
                Hard delete is available to admin/manager only.
"""

from django.db import models
from django.conf import settings


class Product(models.Model):
    # ── Relations ─────────────────────────────────────────────────────────────
    project = models.ForeignKey(
        "projects.Project",
        on_delete    = models.CASCADE,
        related_name = "products",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete    = models.SET_NULL,
        null         = True,
        blank        = True,
        related_name = "created_products",
    )

    # ── Core fields ───────────────────────────────────────────────────────────
    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sku         = models.CharField(
        max_length = 100,
        blank      = True,
        default    = "",
        help_text  = "Stock Keeping Unit. Optional. Must be unique within project.",
    )
    price = models.DecimalField(
        max_digits     = 10,
        decimal_places = 2,
        help_text      = "Selling price.",
    )
    cost_price = models.DecimalField(
        max_digits     = 10,
        decimal_places = 2,
        null           = True,
        blank          = True,
        help_text      = "Purchase / cost price. Optional.",
    )
    unit = models.CharField(
        max_length = 50,
        blank      = True,
        default    = "piece",
        help_text  = "Unit of measurement, e.g. piece, kg, litre.",
    )
    category = models.CharField(
        max_length = 100,
        blank      = True,
        default    = "",
        help_text  = "Free-text category label.",
    )
    is_active = models.BooleanField(
        default   = True,
        help_text = "Inactive products are hidden from normal listings.",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    auto_timestamp = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if self.auto_timestamp and not self.created_at:
            from django.utils import timezone
            self.created_at = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["name"]
        verbose_name        = "Product"
        verbose_name_plural = "Products"
        constraints = [
            # SKU must be unique within a project, but only when SKU is set
            models.UniqueConstraint(
                fields    = ["project", "sku"],
                condition = models.Q(sku__gt=""),   # excludes empty strings
                name      = "unique_sku_per_project",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} [{self.project.name}]"