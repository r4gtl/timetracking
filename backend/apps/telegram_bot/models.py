import secrets

from django.conf import settings
from django.db import models


class TelegramLink(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="telegram_link"
    )
    chat_id = models.BigIntegerField(unique=True, null=True, blank=True)
    link_token = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "collegato" if self.is_active else "non collegato"
        return f"{self.user} ({status})"

    def save(self, *args, **kwargs):
        if not self.link_token:
            self.link_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
