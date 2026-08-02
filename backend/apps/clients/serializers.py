from django.core.validators import RegexValidator
from rest_framework import serializers

from .models import Client

validate_currency = RegexValidator(
    regex=r"^[A-Z]{3}$",
    message="currency must be a 3-letter uppercase currency code (e.g. EUR).",
)


class ClientSerializer(serializers.ModelSerializer):
    currency = serializers.CharField(validators=[validate_currency])

    class Meta:
        model = Client
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")
