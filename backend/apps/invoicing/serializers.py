from rest_framework import serializers

from .models import Invoice, InvoiceLine


class InvoiceLineSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceLine
        fields = "__all__"

    def get_amount(self, obj):
        return obj.amount


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    lines = InvoiceLineSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_client_name(self, obj):
        return obj.client.name

    def get_total_amount(self, obj):
        return sum((line.amount for line in obj.lines.all()), start=0)


class GenerateInvoiceSerializer(serializers.Serializer):
    client = serializers.IntegerField()
    number = serializers.CharField()
    issue_date = serializers.DateField()
    due_date = serializers.DateField(required=False)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["period_end"] < attrs["period_start"]:
            raise serializers.ValidationError(
                {"period_end": "period_end deve essere maggiore o uguale a period_start."}
            )
        return attrs


class AddManualLineSerializer(serializers.Serializer):
    description = serializers.CharField()
    quantity_hours = serializers.DecimalField(max_digits=8, decimal_places=2)
    unit_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
