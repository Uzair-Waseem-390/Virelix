from django.contrib import admin
from sales.models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model       = SaleItem
    extra       = 0
    readonly_fields = ("product", "quantity", "unit_price", "total_price", "created_at")
    can_delete  = False


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display        = ("id", "project", "customer_name", "status", "total_amount", "created_by", "created_at")
    list_filter         = ("status", "project")
    search_fields       = ("customer_name", "customer_phone", "note")
    readonly_fields     = ("created_at", "updated_at", "confirmed_at", "cancelled_at", "total_amount")
    list_select_related = ("project", "created_by")
    inlines             = [SaleItemInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display        = ("sale", "product", "quantity", "unit_price", "total_price", "created_at")
    search_fields       = ("product__name", "sale__customer_name")
    readonly_fields     = ("total_price", "created_at", "updated_at")
    list_select_related = ("sale", "product")