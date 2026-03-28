"""
products/serializers.py
────────────────────────
Input validation + output shaping for Product endpoints.
Zero business logic here.
"""

from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from products.models import Product


# ── Output ────────────────────────────────────────────────────────────────────

class ProductSerializer(serializers.ModelSerializer):
    """Full product representation."""
    created_by_email = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            "id",
            "project",
            "name",
            "description",
            "sku",
            "price",
            "cost_price",
            "unit",
            "category",
            "is_active",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_created_by_email(self, obj) -> str:
        if obj.created_by:
            return obj.created_by.email
        return ""


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    class Meta:
        model  = Product
        fields = [
            "id",
            "name",
            "sku",
            "price",
            "unit",
            "category",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


# ── Create ────────────────────────────────────────────────────────────────────

class CreateProductSerializer(serializers.Serializer):
    name        = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    sku         = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    price       = serializers.DecimalField(max_digits=10, decimal_places=2)
    cost_price  = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    unit        = serializers.CharField(max_length=50, required=False, default="piece")
    category    = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_cost_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Cost price cannot be negative.")
        return value

    def validate_name(self, value):
        return value.strip()


# ── Update ────────────────────────────────────────────────────────────────────

class UpdateProductSerializer(serializers.Serializer):
    name        = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    sku         = serializers.CharField(max_length=100, required=False, allow_blank=True)
    price       = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    cost_price  = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    unit        = serializers.CharField(max_length=50, required=False)
    category    = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_cost_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Cost price cannot be negative.")
        return value

    def validate(self, data):
        if not data:
            raise serializers.ValidationError("Provide at least one field to update.")
        return data