from rest_framework import serializers

from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    effective_hourly_rate = serializers.SerializerMethodField()
    effective_is_billable = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_effective_hourly_rate(self, obj):
        if obj.hourly_rate is not None:
            return obj.hourly_rate
        return obj.project.default_hourly_rate

    def get_effective_is_billable(self, obj):
        if obj.is_billable is not None:
            return obj.is_billable
        return obj.project.is_billable


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def validate_default_hourly_rate(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "default_hourly_rate must be greater than 0."
            )
        return value

    def validate_budget_hours(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "budget_hours must be greater than 0."
            )
        return value
