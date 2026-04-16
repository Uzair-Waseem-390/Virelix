"""
data_entry/admin.py
────────────────────
Django admin registration for DataEntryHistory.
"""

from django.contrib import admin
from data_entry.models import DataEntryHistory


@admin.register(DataEntryHistory)
class DataEntryHistoryAdmin(admin.ModelAdmin):
    list_display  = ["id", "project", "user", "status", "created_at"]
    list_filter   = ["status", "project"]
    search_fields = ["project__name", "user__email"]
    readonly_fields = ["project", "user", "parameters", "status", "error_message", "created_at"]
