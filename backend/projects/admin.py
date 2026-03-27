from django.contrib import admin
from projects.models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display  = ("name", "admin", "ai_status", "has_products", "has_inventory", "has_sales", "created_at")
    list_filter   = ("ai_status",)
    search_fields = ("name", "admin__email")
    readonly_fields = ("created_at", "updated_at", "ai_status", "ai_error")