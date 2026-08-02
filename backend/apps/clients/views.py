from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "email"]
    filterset_fields = ["is_archived"]
    ordering_fields = ["name", "created_at"]

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        client = self.get_object()
        client.is_archived = True
        client.save()
        return Response(self.get_serializer(client).data)

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        client = self.get_object()
        client.is_archived = False
        client.save()
        return Response(self.get_serializer(client).data)
