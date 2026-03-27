from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ("email", "role", "is_active", "has_gemini_key", "created_at")
    list_filter    = ("role", "is_active")
    search_fields  = ("email",)
    ordering       = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "gemini_api_key")

    fieldsets = (
        (None,            {"fields": ("email", "password")}),
        ("Role & Status", {"fields": ("role", "is_active")}),
        ("Gemini Key",    {"fields": ("gemini_api_key",),
                           "description": "Stored encrypted – read-only in admin."}),
        ("Timestamps",    {"fields": ("created_at", "updated_at")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "password1", "password2", "role"),
        }),
    )