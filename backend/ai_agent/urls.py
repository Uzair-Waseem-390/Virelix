from django.urls import path
from ai_agent import views

app_name = "ai_agent"

urlpatterns = [

    # ── Chat sessions ─────────────────────────────────────────────────────────
    path("chats/",
         views.AgentChatListCreateView.as_view(),
         name="chat-list"),

    path("chats/<int:pk>/",
         views.AgentChatDetailView.as_view(),
         name="chat-detail"),

    # ── Send a message to the analyst ─────────────────────────────────────────
    path("chats/<int:pk>/send/",
         views.AgentMessageCreateView.as_view(),
         name="chat-send"),
]
