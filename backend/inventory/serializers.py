"""
inventory/serializers.py
─────────────────────────
Input validation + output shaping for Inventory endpoints.
Zero business logic here.
"""

from rest_framework import serializers
from inventory.models import Inventory, StockMovement, MovementType


# ── Output ────────────────────────────────────────────────────────────────────

class InventorySerializer(serializers.ModelSerializer):
    """Full inventory record with product info."""
    product_name     = serializers.CharField(source="product.name",     read_only=True)
    product_sku      = serializers.CharField(source="product.sku",      read_only=True)
    product_unit     = serializers.CharField(source="product.unit",     read_only=True)
    product_category = serializers.CharField(source="product.category", read_only=True)
    is_low_stock     = serializers.BooleanField(read_only=True)
    is_out_of_stock  = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Inventory
        fields = [
            "id",
            "project",
            "product",
            "product_name",
            "product_sku",
            "product_unit",
            "product_category",
            "quantity",
            "low_stock_threshold",
            "location",
            "is_low_stock",
            "is_out_of_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class InventoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    product_name    = serializers.CharField(source="product.name", read_only=True)
    product_sku     = serializers.CharField(source="product.sku",  read_only=True)
    is_low_stock    = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Inventory
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "quantity",
            "low_stock_threshold",
            "location",
            "is_low_stock",
            "is_out_of_stock",
            "updated_at",
        ]
        read_only_fields = fields


class StockMovementSerializer(serializers.ModelSerializer):
    """Full stock movement record."""
    performed_by_email = serializers.SerializerMethodField()
    product_name       = serializers.CharField(
        source="inventory.product.name", read_only=True
    )

    class Meta:
        model  = StockMovement
        fields = [
            "id",
            "inventory",
            "product_name",
            "movement_type",
            "quantity",
            "quantity_before",
            "quantity_after",
            "note",
            "performed_by_email",
            "created_at",
        ]
        read_only_fields = fields

    def get_performed_by_email(self, obj) -> str:
        return obj.performed_by.email if obj.performed_by else ""


# ── Create inventory record ───────────────────────────────────────────────────

class CreateInventorySerializer(serializers.Serializer):
    product_id          = serializers.IntegerField(help_text="ID of the product to track.")
    quantity            = serializers.IntegerField(min_value=0, default=0)
    low_stock_threshold = serializers.IntegerField(min_value=0, default=10)
    location            = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")


# ── Update inventory settings ─────────────────────────────────────────────────

class UpdateInventorySerializer(serializers.Serializer):
    low_stock_threshold = serializers.IntegerField(min_value=0, required=False)
    location            = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field to update.")
        return data


# ── Stock movement inputs ─────────────────────────────────────────────────────

class StockInSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, help_text="Units to add to stock.")
    note     = serializers.CharField(required=False, allow_blank=True, default="")


class StockOutSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, help_text="Units to remove from stock.")
    note     = serializers.CharField(required=False, allow_blank=True, default="")


class StockAdjustSerializer(serializers.Serializer):
    new_quantity = serializers.IntegerField(
        min_value = 0,
        help_text = "Set stock to this exact quantity (manual stocktake correction).",
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")