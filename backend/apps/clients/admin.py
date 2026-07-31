from django.contrib import admin

from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "currency", "is_archived", "created_at")
    list_filter = ("is_archived", "currency")
    search_fields = ("name", "email")
