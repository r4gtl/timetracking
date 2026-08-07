from decimal import ROUND_HALF_UP, Decimal

from .models import TimeEntry


def filter_report_queryset(request, data):
    queryset = TimeEntry.objects.select_related(
        "project", "project__client", "task", "user"
    )

    if not request.user.is_staff:
        queryset = queryset.filter(user=request.user)
    elif "user" in data:
        queryset = queryset.filter(user_id=data["user"])

    if "client" in data:
        queryset = queryset.filter(project__client_id=data["client"])
    if "project" in data:
        queryset = queryset.filter(project_id=data["project"])
    if "task" in data:
        queryset = queryset.filter(task_id=data["task"])
    if "start_after" in data:
        queryset = queryset.filter(start_time__date__gte=data["start_after"])
    if "start_before" in data:
        queryset = queryset.filter(start_time__date__lte=data["start_before"])
    if "is_billable" in data:
        queryset = queryset.filter(is_billable=data["is_billable"])

    return queryset


def compute_report_data(queryset) -> dict:
    total_hours = Decimal("0")
    total_amount = Decimal("0")
    entries_count = 0
    by_client = {}
    by_project = {}
    detail_rows = []

    for entry in queryset:
        hours = Decimal(entry.duration.total_seconds()) / Decimal(3600)
        rate = entry.resolve_hourly_rate()
        amount = (
            (hours * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if rate is not None
            else None
        )

        entries_count += 1
        total_hours += hours
        if amount is not None:
            total_amount += amount

        client = entry.project.client
        client_bucket = by_client.setdefault(
            client.id,
            {
                "client_id": client.id,
                "client_name": client.name,
                "total_hours": Decimal("0"),
                "total_amount": Decimal("0"),
            },
        )
        client_bucket["total_hours"] += hours
        if amount is not None:
            client_bucket["total_amount"] += amount

        project = entry.project
        project_bucket = by_project.setdefault(
            project.id,
            {
                "project_id": project.id,
                "project_name": project.name,
                "client_name": client.name,
                "total_hours": Decimal("0"),
                "total_amount": Decimal("0"),
            },
        )
        project_bucket["total_hours"] += hours
        if amount is not None:
            project_bucket["total_amount"] += amount

        description = entry.description or (
            f"{project.name} - {entry.task.name if entry.task else 'Generico'}"
        )
        detail_rows.append(
            {
                "date": entry.start_time.date(),
                "client_name": client.name,
                "project_name": project.name,
                "description": description,
                "hours": hours.quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                ),
                "rate": rate,
                "amount": amount,
            }
        )

    def finalize(bucket):
        bucket["total_hours"] = round(float(bucket["total_hours"]), 2)
        bucket["total_amount"] = round(float(bucket["total_amount"]), 2)
        return bucket

    by_client_list = sorted(
        (finalize(bucket) for bucket in by_client.values()),
        key=lambda bucket: bucket["total_hours"],
        reverse=True,
    )
    by_project_list = sorted(
        (finalize(bucket) for bucket in by_project.values()),
        key=lambda bucket: bucket["total_hours"],
        reverse=True,
    )

    detail_rows.sort(key=lambda row: row["date"])

    return {
        "totals": {
            "total_hours": round(float(total_hours), 2),
            "total_amount": round(float(total_amount), 2),
            "entries_count": entries_count,
        },
        "by_client": by_client_list,
        "by_project": by_project_list,
        "detail_rows": detail_rows,
    }
