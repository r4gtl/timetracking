from django.conf import settings
from rest_framework import serializers


class TelegramLinkSerializer(serializers.Serializer):
    is_active = serializers.BooleanField(read_only=True)
    deep_link = serializers.SerializerMethodField()

    def get_deep_link(self, obj):
        return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={obj.link_token}"
