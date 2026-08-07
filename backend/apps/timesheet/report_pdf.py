import io

from django.contrib.staticfiles import finders
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def build_report_pdf(filters_data, report_data) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm
    )
    styles = getSampleStyleSheet()
    elements = []

    # Logo aziendale in testa alla PDF; se il file non è ancora stato
    # raccolto da collectstatic, salta senza far fallire la generazione.
    logo_path = finders.find("invoicing/logo.png")
    if logo_path:
        elements.append(
            Image(
                logo_path, width=4 * cm, height=1.5 * cm, kind="proportional"
            )
        )
        elements.append(Spacer(1, 0.3 * cm))

    elements.append(Paragraph("Riepilogo ore", styles["Title"]))
    elements.append(Spacer(1, 0.3 * cm))

    start_after = filters_data.get("start_after")
    start_before = filters_data.get("start_before")
    if start_after or start_before:
        period_parts = []
        if start_after:
            period_parts.append(start_after.strftime("%d/%m/%Y"))
        if start_before:
            period_parts.append(start_before.strftime("%d/%m/%Y"))
        elements.append(
            Paragraph(f"Periodo: {' - '.join(period_parts)}", styles["Normal"])
        )
    elements.append(Spacer(1, 0.5 * cm))

    totals = report_data["totals"]
    elements.append(Paragraph("Totale", styles["Heading3"]))
    elements.append(
        Paragraph(f"Ore totali: {totals['total_hours']:.2f}", styles["Normal"])
    )
    elements.append(
        Paragraph(
            f"Importo totale: {totals['total_amount']:.2f}", styles["Normal"]
        )
    )
    elements.append(
        Paragraph(
            f"Numero registrazioni: {totals['entries_count']}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 0.8 * cm))

    table_data = [
        [
            "Data",
            "Cliente",
            "Progetto",
            "Descrizione",
            "Ore",
            "Tariffa",
            "Importo",
        ]
    ]
    for row in report_data["detail_rows"]:
        rate = row["rate"]
        amount = row["amount"]
        table_data.append(
            [
                row["date"].strftime("%d/%m/%Y"),
                row["client_name"],
                row["project_name"],
                row["description"],
                f"{row['hours']}",
                f"{rate}" if rate is not None else "-",
                f"{amount}" if amount is not None else "-",
            ]
        )

    col_widths = [
        2.2 * cm,
        2.8 * cm,
        2.8 * cm,
        5 * cm,
        1.5 * cm,
        2 * cm,
        2.2 * cm,
    ]
    table = Table(table_data, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#333333")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (4, 1), (-1, -1), "RIGHT"),
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
            f"<b>Totale: {totals['total_amount']:.2f}</b>",
            styles["Normal"],
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer
