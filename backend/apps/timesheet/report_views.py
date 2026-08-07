from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .report_filters import compute_report_data, filter_report_queryset
from .report_pdf import build_report_pdf
from .report_serializers import ReportFilterSerializer
from .serializers import TimeEntrySerializer


class ReportSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = ReportFilterSerializer(data=request.query_params.dict())
        filters.is_valid(raise_exception=True)
        data = filters.validated_data

        queryset = filter_report_queryset(request, data)
        report_data = compute_report_data(queryset)

        payload = {
            "totals": report_data["totals"],
            "by_client": report_data["by_client"],
            "by_project": report_data["by_project"],
            "entries": TimeEntrySerializer(
                queryset, many=True, context={"request": request}
            ).data,
        }
        return Response(payload)


class ReportSummaryPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = ReportFilterSerializer(data=request.query_params.dict())
        filters.is_valid(raise_exception=True)
        data = filters.validated_data

        queryset = filter_report_queryset(request, data)
        report_data = compute_report_data(queryset)
        buffer = build_report_pdf(data, report_data)

        start_after = data.get("start_after")
        start_before = data.get("start_before")
        if start_after and start_before:
            filename = f"riepilogo_{start_after}_{start_before}.pdf"
        else:
            filename = "riepilogo.pdf"

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )
