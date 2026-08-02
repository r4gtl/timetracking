from django.urls import path
from rest_framework.routers import DefaultRouter

from .report_views import ReportSummaryView
from .views import TimeEntryViewSet, UserProjectRateViewSet

router = DefaultRouter()
router.register("user-project-rates", UserProjectRateViewSet, basename="user-project-rate")
router.register("time-entries", TimeEntryViewSet, basename="time-entry")

urlpatterns = [
    path("reports/summary/", ReportSummaryView.as_view(), name="report-summary"),
] + router.urls
