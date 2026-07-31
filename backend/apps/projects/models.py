from django.db import models


class Project(models.Model):
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="projects"
    )
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default="#03A9F4")
    is_billable = models.BooleanField(default=True)
    default_hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    budget_hours = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["client__name", "name"]
        unique_together = [("client", "name")]

    def __str__(self):
        return f"{self.client.name} / {self.name}"


class Task(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks"
    )
    name = models.CharField(max_length=255)
    hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    is_billable = models.BooleanField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["project", "name"]
        unique_together = [("project", "name")]

    def __str__(self):
        return f"{self.project} / {self.name}"
