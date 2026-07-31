from django.contrib import admin

from .models import Project, Task


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "client",
        "is_billable",
        "default_hourly_rate",
        "budget_hours",
        "is_archived",
    )
    list_filter = ("is_archived", "is_billable", "client")
    search_fields = ("name", "client__name")
    inlines = [TaskInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("name", "project", "hourly_rate", "is_billable", "is_archived")
    list_filter = ("is_archived", "is_billable")
    search_fields = ("name", "project__name")
