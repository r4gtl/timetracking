from django.contrib import admin

from .models import Invoice, InvoiceLine


class InvoiceLineInline(admin.TabularInline):
    model = InvoiceLine
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "client", "status", "issue_date", "due_date", "currency")
    list_filter = ("status", "currency")
    search_fields = ("number", "client__name")
    inlines = [InvoiceLineInline]
