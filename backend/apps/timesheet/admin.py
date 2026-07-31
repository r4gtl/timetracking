from django.contrib import admin

from .models import TimeEntry, UserProjectRate


@admin.register(UserProjectRate)
class UserProjectRateAdmin(admin.ModelAdmin):
    list_display = ("user", "project", "hourly_rate")
    search_fields = ("user__username", "project__name")


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "project",
        "task",
        "start_time",
        "duration_display",
        "is_billable",
        "is_invoiced",
    )
    list_filter = ("is_billable", "is_invoiced", "project")
    search_fields = ("description", "user__username", "project__name")

    @admin.display(description="Duration")
    def duration_display(self, obj):
        total_seconds = int(obj.duration.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes = remainder // 60
        return f"{hours}h{minutes:02d}m"
