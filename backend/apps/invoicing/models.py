from django.db import models


class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        PAID = "paid", "Paid"

    client = models.ForeignKey(
        "clients.Client", on_delete=models.PROTECT, related_name="invoices"
    )
    number = models.CharField(max_length=50, unique=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    currency = models.CharField(max_length=3, default="EUR")
    issue_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issue_date", "-number"]

    def __str__(self):
        return self.number


class InvoiceLine(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="lines")
    time_entry = models.ForeignKey(
        "timesheet.TimeEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice_lines",
    )
    description = models.CharField(max_length=500)
    quantity_hours = models.DecimalField(max_digits=8, decimal_places=2)
    unit_rate = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.invoice.number} - {self.description}"

    @property
    def amount(self):
        return self.quantity_hours * self.unit_rate
