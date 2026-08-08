from django.contrib import admin

from .models import TelegramLink


@admin.register(TelegramLink)
class TelegramLinkAdmin(admin.ModelAdmin):
    list_display = ("user", "is_active", "chat_id", "created_at")
    list_filter = ("is_active",)
    readonly_fields = ("link_token", "chat_id")
    search_fields = ("user__username",)
