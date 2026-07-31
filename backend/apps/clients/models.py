from django.db import models


class Client(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    currency = models.CharField(max_length=3, default="EUR")
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
