"""
sales/serializers.py
─────────────────────
Input validation + output shaping for Sales endpoints.
Zero business logic here.
"""

from decimal import Decimal
from rest_framework import serializers
from sales.models import Sale, SaleItem, SaleStatus


# ── Output ────────────────────────────────────────────────────────────────────

class SaleItemSerializer(serializers.ModelSerializer):
    """Full sale item with product info."""
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku  = serializers.CharField(source="product.sku",  read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)

    class Meta:
        model  = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "product_unit",
            "quantity",
            "unit_price",
            "total_price",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class SaleSerializer(serializers.ModelSerializer):
    """Full sale with all items."""
    items              = SaleItemSerializer(many=True, read_only=True)
    created_by_email   = serializers.SerializerMethodField()
    item_count         = serializers.SerializerMethodField()

    class Meta:
        model  = Sale
        fields = [
            "id",
            "project",
            "status",
            "customer_name",
            "customer_phone",
            "note",
            "total_amount",
            "item_count",
            "items",
            "created_by_email",
            "created_at",
            "updated_at",
            "confirmed_at",
            "cancelled_at",
        ]
        read_only_fields = fields

    def get_created_by_email(self, obj) -> str:
        return obj.created_by.email if obj.created_by else ""

    def get_item_count(self, obj) -> int:
        return obj.items.count()


class SaleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no items."""
    created_by_email = serializers.SerializerMethodField()
    item_count       = serializers.SerializerMethodField()

    class Meta:
        model  = Sale
        fields = [
            "id",
            "status",
            "customer_name",
            "customer_phone",
            "total_amount",
            "item_count",
            "created_by_email",
            "created_at",
            "confirmed_at",
            "cancelled_at",
        ]
        read_only_fields = fields

    def get_created_by_email(self, obj) -> str:
        return obj.created_by.email if obj.created_by else ""

    def get_item_count(self, obj) -> int:
        return obj.items.count()


# ── Create / Update sale header ───────────────────────────────────────────────

class CreateSaleSerializer(serializers.Serializer):
    customer_name  = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    customer_phone = serializers.CharField(max_length=50,  required=False, allow_blank=True, default="")
    note           = serializers.CharField(required=False, allow_blank=True, default="")


class UpdateSaleSerializer(serializers.Serializer):
    customer_name  = serializers.CharField(max_length=200, required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=50,  required=False, allow_blank=True)
    note           = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field to update.")
        return data


# ── Sale items ────────────────────────────────────────────────────────────────

class AddSaleItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(help_text="ID of the product to add.")
    quantity   = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(
        max_digits     = 10,
        decimal_places = 2,
        required       = False,
        allow_null     = True,
        help_text      = "Optional override price. Defaults to product's current price.",
    )

    def validate_unit_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return value


class UpdateSaleItemSerializer(serializers.Serializer):
    quantity   = serializers.IntegerField(min_value=1, required=False)
    unit_price = serializers.DecimalField(
        max_digits     = 10,
        decimal_places = 2,
        required       = False,
        allow_null     = True,
    )

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field to update.")
        return data

    def validate_unit_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return value


# ── Summary ───────────────────────────────────────────────────────────────────

class SalesSummarySerializer(serializers.Serializer):
    total_confirmed_sales = serializers.IntegerField()
    total_revenue         = serializers.DecimalField(max_digits=14, decimal_places=2)