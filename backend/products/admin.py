from django.contrib import admin
from products.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ("name", "project", "sku", "price", "category", "is_active", "created_at")
    list_filter    = ("is_active", "project")
    search_fields  = ("name", "sku", "category", "project__name")
    readonly_fields = ("created_at", "updated_at", "created_by")
    list_select_related = ("project", "created_by")