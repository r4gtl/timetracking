from rest_framework import serializers


class ReportFilterSerializer(serializers.Serializer):
    client = serializers.IntegerField(required=False)
    project = serializers.IntegerField(required=False)
    task = serializers.IntegerField(required=False)
    user = serializers.IntegerField(required=False)
    start_after = serializers.DateField(required=False)
    start_before = serializers.DateField(required=False)
    is_billable = serializers.BooleanField(required=False)
