from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import TimeEntry


def get_active_timer(user):
    return TimeEntry.objects.filter(user=user, end_time__isnull=True).first()


def start_timer(user, project_id, task_id=None, description=""):
    if get_active_timer(user) is not None:
        raise ValidationError("Hai già un timer in corso, fermalo prima di avviarne un altro")

    entry = TimeEntry(
        user=user,
        project_id=project_id,
        task_id=task_id,
        description=description,
        start_time=timezone.now(),
        end_time=None,
    )
    entry.full_clean()
    entry.save()
    return entry


def stop_timer(user, time_entry_id):
    entry = TimeEntry.objects.get(id=time_entry_id, user=user)
    if entry.end_time is not None:
        raise ValidationError("Questa time entry è già conclusa")

    entry.end_time = timezone.now()
    entry.save()
    return entry
