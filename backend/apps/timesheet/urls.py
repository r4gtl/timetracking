from rest_framework.routers import DefaultRouter

from .views import TimeEntryViewSet, UserProjectRateViewSet

router = DefaultRouter()
router.register("user-project-rates", UserProjectRateViewSet, basename="user-project-rate")
router.register("time-entries", TimeEntryViewSet, basename="time-entry")

urlpatterns = router.urls
