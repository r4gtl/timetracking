from django.db import connection
from django.http import JsonResponse


def health_check(request):
    """Lightweight liveness/readiness probe for Render.

    Plain Django view (not a DRF APIView) so it stays outside
    DEFAULT_PERMISSION_CLASSES and requires no authentication -
    Render's health checker hits it unauthenticated.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as exc:
        return JsonResponse({"status": "error", "detail": str(exc)}, status=503)

    return JsonResponse({"status": "ok"})
