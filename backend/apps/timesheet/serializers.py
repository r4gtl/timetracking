from decimal import ROUND_HALF_UP, Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import TimeEntry, UserProjectRate


class UserProjectRateSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProjectRate
        fields = "__all__"

    def get_user_username(self, obj):
        return obj.user.username

    def get_project_name(self, obj):
        return obj.project.name


class TimeEntrySerializer(serializers.ModelSerializer):
    duration_seconds = serializers.SerializerMethodField()
    resolved_hourly_rate = serializers.SerializerMethodField()
    estimated_amount = serializers.SerializerMethodField()

    class Meta:
        model = TimeEntry
        fields = "__all__"
        read_only_fields = ("user", "created_at", "updated_at")

    def get_duration_seconds(self, obj):
        return int(obj.duration.total_seconds())

    def get_resolved_hourly_rate(self, obj):
        return obj.resolve_hourly_rate()

    def get_estimated_amount(self, obj):
        rate = obj.resolve_hourly_rate()
        if rate is None:
            return None
        hours = Decimal(obj.duration.total_seconds()) / Decimal(3600)
        return (hours * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def validate(self, attrs):
        request = self.context.get("request")
        instance = self.instance

        def field_value(name, default=None):
            if name in attrs:
                return attrs[name]
            if instance is not None:
                return getattr(instance, name)
            return default

        project = field_value("project")

        temp = TimeEntry(
            user=instance.user if instance is not None else request.user,
            project=project,
            task=field_value("task"),
            description=field_value("description", ""),
            start_time=field_value("start_time"),
            end_time=field_value("end_time"),
            is_billable=field_value("is_billable", True),
            is_invoiced=field_value("is_invoiced", False),
        )
        if instance is not None:
            temp.pk = instance.pk

        try:
            temp.full_clean(exclude=["id"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            )

        if instance is None and project is not None and project.is_archived:
            raise serializers.ValidationError(
                {"project": "Non è possibile registrare ore su un progetto archiviato"}
            )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
