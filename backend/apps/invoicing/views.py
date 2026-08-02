import io
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.clients.models import Client
from apps.timesheet.models import TimeEntry

from .models import Invoice, InvoiceLine
from .serializers import (
    AddManualLineSerializer,
    GenerateInvoiceSerializer,
    InvoiceSerializer,
)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("client").prefetch_related("lines")
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["client", "status"]
    ordering_fields = ["issue_date", "number"]
    ordering = ["-issue_date"]

    @action(detail=False, methods=["post"])
    def generate(self, request):
        input_serializer = GenerateInvoiceSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        client = get_object_or_404(Client, pk=data["client"])

        with transaction.atomic():
            entries = TimeEntry.objects.select_related("project", "task").filter(
                project__client=client,
                is_billable=True,
                is_invoiced=False,
                start_time__date__gte=data["period_start"],
                start_time__date__lte=data["period_end"],
            )

            if not entries.exists():
                return Response(
                    {
                        "detail": "Nessuna ora fatturabile trovata per il periodo e cliente indicati"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            invoice = Invoice.objects.create(
                client=client,
                number=data["number"],
                issue_date=data["issue_date"],
                due_date=data.get("due_date"),
                notes=data.get("notes", ""),
                status=Invoice.Status.DRAFT,
                currency=client.currency,
            )

            skipped_entries_count = 0
            invoiced_entry_ids = []

            for entry in entries:
                rate = entry.resolve_hourly_rate()
                if rate is None:
                    skipped_entries_count += 1
                    continue

                description = entry.description or (
                    f"{entry.project.name} - "
                    f"{entry.task.name if entry.task else 'Generico'}"
                )
                hours = (Decimal(entry.duration.total_seconds()) / Decimal(3600)).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

                InvoiceLine.objects.create(
                    invoice=invoice,
                    time_entry=entry,
                    description=description,
                    quantity_hours=hours,
                    unit_rate=rate,
                )
                invoiced_entry_ids.append(entry.id)

            if not invoiced_entry_ids:
                transaction.set_rollback(True)
                return Response(
                    {
                        "detail": "Nessuna delle ore nel periodo indicato ha una tariffa "
                        "oraria configurata"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            TimeEntry.objects.filter(id__in=invoiced_entry_ids).update(is_invoiced=True)

        invoice.refresh_from_db()
        payload = InvoiceSerializer(invoice, context=self.get_serializer_context()).data
        payload["skipped_entries_count"] = skipped_entries_count
        return Response(payload, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def add_manual_line(self, request, pk=None):
        invoice = self.get_object()
        input_serializer = AddManualLineSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        InvoiceLine.objects.create(
            invoice=invoice,
            time_entry=None,
            description=data["description"],
            quantity_hours=data["quantity_hours"],
            unit_rate=data["unit_rate"],
        )

        invoice.refresh_from_db()
        return Response(
            InvoiceSerializer(invoice, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        invoice = self.get_object()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm
        )
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(f"Fattura {invoice.number}", styles["Title"]))
        elements.append(Spacer(1, 0.3 * cm))
        elements.append(
            Paragraph(
                f"Data emissione: {invoice.issue_date.strftime('%d/%m/%Y')}",
                styles["Normal"],
            )
        )
        if invoice.due_date:
            elements.append(
                Paragraph(
                    f"Scadenza: {invoice.due_date.strftime('%d/%m/%Y')}", styles["Normal"]
                )
            )
        elements.append(Spacer(1, 0.5 * cm))

        elements.append(Paragraph("Cliente", styles["Heading3"]))
        elements.append(Paragraph(invoice.client.name, styles["Normal"]))
        if invoice.client.email:
            elements.append(Paragraph(invoice.client.email, styles["Normal"]))
        if invoice.client.address:
            address_html = invoice.client.address.replace("\n", "<br/>")
            elements.append(Paragraph(address_html, styles["Normal"]))
        elements.append(Spacer(1, 0.8 * cm))

        table_data = [["Descrizione", "Ore", "Tariffa", "Importo"]]
        total = Decimal("0")
        for line in invoice.lines.all():
            table_data.append(
                [
                    line.description,
                    f"{line.quantity_hours}",
                    f"{line.unit_rate} {invoice.currency}",
                    f"{line.amount.quantize(Decimal('0.01'))} {invoice.currency}",
                ]
            )
            total += line.amount

        table = Table(table_data, colWidths=[8 * cm, 2.5 * cm, 3 * cm, 3.5 * cm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#333333")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f5f5f5")],
                    ),
                ]
            )
        )
        elements.append(table)
        elements.append(Spacer(1, 0.5 * cm))
        elements.append(
            Paragraph(
                f"<b>Totale: {total.quantize(Decimal('0.01'))} {invoice.currency}</b>",
                styles["Normal"],
            )
        )

        if invoice.notes:
            elements.append(Spacer(1, 0.8 * cm))
            elements.append(Paragraph("Note", styles["Heading3"]))
            elements.append(Paragraph(invoice.notes.replace("\n", "<br/>"), styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"fattura_{invoice.number}.pdf",
            content_type="application/pdf",
        )
