from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("client").prefetch_related("tasks")
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "client__name"]
    filterset_fields = ["client", "is_archived", "is_billable"]
    ordering_fields = ["name", "created_at"]

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        project = self.get_object()
        project.is_archived = True
        project.save()
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        project = self.get_object()
        project.is_archived = False
        project.save()
        return Response(self.get_serializer(project).data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("project", "project__client")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["project", "is_archived"]

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        task = self.get_object()
        task.is_archived = True
        task.save()
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        task = self.get_object()
        task.is_archived = False
        task.save()
        return Response(self.get_serializer(task).data)
