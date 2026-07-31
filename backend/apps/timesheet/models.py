from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class UserProjectRate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="user_rates"
    )
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = [("user", "project")]

    def __str__(self):
        return f"{self.user} @ {self.project} = {self.hourly_rate}"


class TimeEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="time_entries"
    )
    project = models.ForeignKey(
        "projects.Project", on_delete=models.PROTECT, related_name="time_entries"
    )
    task = models.ForeignKey(
        "projects.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="time_entries",
    )
    description = models.CharField(max_length=500, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    is_billable = models.BooleanField(default=True)
    is_invoiced = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.user} - {self.project} ({self.start_time})"

    @property
    def duration(self):
        end = self.end_time or timezone.now()
        return end - self.start_time

    def resolve_hourly_rate(self) -> Decimal | None:
        user_rate = UserProjectRate.objects.filter(
            user=self.user, project=self.project
        ).first()
        if user_rate is not None:
            return user_rate.hourly_rate

        if self.task_id and self.task.hourly_rate is not None:
            return self.task.hourly_rate

        return self.project.default_hourly_rate

    def clean(self):
        if self.end_time and self.start_time and self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after start time."})

        if self.task_id and self.task.project_id != self.project_id:
            raise ValidationError(
                {"task": "The task must belong to the same project as the time entry."}
            )
