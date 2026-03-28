from django.contrib import admin
from inventory.models import Inventory, StockMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display        = ("product", "project", "quantity", "low_stock_threshold", "is_low_stock", "location", "updated_at")
    list_filter         = ("project",)
    search_fields       = ("product__name", "product__sku", "location")
    readonly_fields     = ("created_at", "updated_at")
    list_select_related = ("product", "project")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display        = ("inventory", "movement_type", "quantity", "quantity_before", "quantity_after", "performed_by", "created_at")
    list_filter         = ("movement_type",)
    search_fields       = ("inventory__product__name", "note")
    readonly_fields     = ("created_at",)
    list_select_related = ("inventory__product", "performed_by")