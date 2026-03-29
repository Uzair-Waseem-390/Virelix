"""
dashboard/serializers.py
─────────────────────────
Output serializers for dashboard endpoints only.
No input serializers needed — dashboards are read-only.
"""

from rest_framework import serializers
from projects.models import Project
from inventory.models import Inventory


class DashboardProjectSerializer(serializers.ModelSerializer):
    """Compact project card shown on the admin main dashboard."""
    enabled_modules = serializers.ListField(read_only=True)

    class Meta:
        model  = Project
        fields = [
            "id",
            "name",
            "ai_status",
            "has_products",
            "has_inventory",
            "has_sales",
            "enabled_modules",
            "created_at",
        ]
        read_only_fields = fields


class DashboardInventoryAlertSerializer(serializers.ModelSerializer):
    """Inventory row shown in low-stock / out-of-stock alert lists."""
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku  = serializers.CharField(source="product.sku",  read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_id   = serializers.IntegerField(source="project.id", read_only=True)

    class Meta:
        model  = Inventory
        fields = [
            "id",
            "project_id",
            "project_name",
            "product_name",
            "product_sku",
            "quantity",
            "low_stock_threshold",
        ]
        read_only_fields = fields


class AdminDashboardSerializer(serializers.Serializer):
    """Full admin main dashboard payload."""
    projects              = DashboardProjectSerializer(many=True)
    total_products        = serializers.IntegerField()
    low_stock_items       = DashboardInventoryAlertSerializer(many=True)
    out_of_stock_items    = DashboardInventoryAlertSerializer(many=True)
    total_confirmed_sales = serializers.IntegerField()
    total_draft_sales     = serializers.IntegerField()
    total_revenue         = serializers.CharField()


class ProjectDashboardSerializer(serializers.Serializer):
    """Project-specific dashboard payload (manager/staff + admin entering a project)."""
    # Project info + sidebar modules
    project_id      = serializers.SerializerMethodField()
    project_name    = serializers.SerializerMethodField()
    ai_status       = serializers.SerializerMethodField()
    enabled_modules = serializers.SerializerMethodField()
    has_products    = serializers.SerializerMethodField()
    has_inventory   = serializers.SerializerMethodField()
    has_sales       = serializers.SerializerMethodField()

    # Stats
    total_products        = serializers.IntegerField()
    low_stock_items       = DashboardInventoryAlertSerializer(many=True)
    out_of_stock_items    = DashboardInventoryAlertSerializer(many=True)
    total_confirmed_sales = serializers.IntegerField()
    total_draft_sales     = serializers.IntegerField()
    total_revenue         = serializers.CharField()

    def get_project_id(self, obj):      return obj["project"].pk
    def get_project_name(self, obj):    return obj["project"].name
    def get_ai_status(self, obj):       return obj["project"].ai_status
    def get_enabled_modules(self, obj): return obj["project"].enabled_modules
    def get_has_products(self, obj):    return obj["project"].has_products
    def get_has_inventory(self, obj):   return obj["project"].has_inventory
    def get_has_sales(self, obj):       return obj["project"].has_sales