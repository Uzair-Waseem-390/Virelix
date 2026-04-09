from django.contrib import admin
from ai_agent.models import AgentChat, AgentMessage


class AgentMessageInline(admin.TabularInline):
    model  = AgentMessage
    extra  = 0
    fields = ["role", "content", "created_at"]
    readonly_fields = ["role", "content", "created_at"]
    ordering = ["created_at"]
    can_delete = False


@admin.register(AgentChat)
class AgentChatAdmin(admin.ModelAdmin):
    list_display  = ["id", "title", "project", "user", "created_at", "updated_at"]
    list_filter   = ["project"]
    search_fields = ["title", "user__email", "project__name"]
    readonly_fields = ["created_at", "updated_at"]
    inlines       = [AgentMessageInline]


@admin.register(AgentMessage)
class AgentMessageAdmin(admin.ModelAdmin):
    list_display  = ["id", "chat", "role", "created_at"]
    list_filter   = ["role"]
    search_fields = ["content", "chat__title"]
    readonly_fields = ["chat", "role", "content", "created_at"]
