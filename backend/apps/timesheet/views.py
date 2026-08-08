import django_filters
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import services
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
        try:
            entry = services.start_timer(
                user=request.user,
                project_id=request.data.get("project"),
                task_id=request.data.get("task"),
                description=request.data.get("description", ""),
            )
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(self.get_serializer(entry).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def stop(self, request, pk=None):
        try:
            entry = services.stop_timer(user=request.user, time_entry_id=pk)
        except TimeEntry.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(self.get_serializer(entry).data)
