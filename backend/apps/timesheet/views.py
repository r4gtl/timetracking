import django_filters
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import TimeEntry, UserProjectRate
from .serializers import TimeEntrySerializer, UserProjectRateSerializer


class UserProjectRateViewSet(viewsets.ModelViewSet):
    queryset = UserProjectRate.objects.select_related("user", "project")
    serializer_class = UserProjectRateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["user", "project"]


class TimeEntryFilter(django_filters.FilterSet):
    start_after = django_filters.DateFilter(field_name="start_time", lookup_expr="gte")
    start_before = django_filters.DateFilter(field_name="start_time", lookup_expr="lte")

    class Meta:
        model = TimeEntry
        fields = ["project", "task", "is_billable", "is_invoiced"]


class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = TimeEntryFilter
    ordering_fields = ["start_time"]
    ordering = ["-start_time"]

    def get_queryset(self):
        queryset = TimeEntry.objects.select_related("project", "task", "user")
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def start(self, request):
        if TimeEntry.objects.filter(user=request.user, end_time__isnull=True).exists():
            return Response(
                {"detail": "Hai già un timer in corso, fermalo prima di avviarne un altro"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "project": request.data.get("project"),
            "task": request.data.get("task"),
            "description": request.data.get("description", ""),
            "start_time": timezone.now(),
            "end_time": None,
        }
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def stop(self, request, pk=None):
        entry = self.get_object()
        if entry.end_time is not None:
            return Response(
                {"detail": "Questa time entry è già conclusa"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        entry.end_time = timezone.now()
        entry.save()
        return Response(self.get_serializer(entry).data)
