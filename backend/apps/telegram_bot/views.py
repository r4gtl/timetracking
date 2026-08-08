from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from apps.timesheet import services as timesheet_services
from apps.timesheet.models import TimeEntry

from . import bot_api
from . import services as telegram_services
from .models import TelegramLink
from .serializers import TelegramLinkSerializer
from .utils import format_duration

NOT_LINKED_MESSAGE = (
    "Il tuo account Telegram non è ancora collegato. Vai sul sito, in Impostazioni, "
    "per generare il link di collegamento."
)


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(APIView):
    permission_classes = [AllowAny]

    COMMAND_HANDLERS = {
        "/timer": "_handle_timer",
        "/stop": "_handle_stop",
        "/oggi": "_handle_oggi",
    }

    def post(self, request):
        secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if secret != settings.TELEGRAM_WEBHOOK_SECRET:
            return Response({"detail": "Forbidden"}, status=403)

        update = request.data if isinstance(request.data, dict) else {}

        callback_query = update.get("callback_query")
        if isinstance(callback_query, dict):
            self._handle_callback_query(callback_query)
            return Response({"ok": True}, status=200)

        message = update.get("message")
        text = message.get("text") if isinstance(message, dict) else None

        if isinstance(text, str):
            if text.startswith("/start"):
                self._handle_start(message, text)
            elif text in self.COMMAND_HANDLERS:
                self._dispatch_command(message, text)

        return Response({"ok": True}, status=200)

    def _handle_start(self, message, text):
        chat_id = message.get("chat", {}).get("id")
        parts = text.split(maxsplit=1)
        token = parts[1].strip() if len(parts) > 1 else ""

        if not token:
            bot_api.send_message(
                chat_id,
                "Per collegare il tuo account, genera il link di collegamento dal sito "
                "e apri il link che ti verrà mostrato: ti porterà qui con il token già pronto.",
            )
            return

        try:
            link = TelegramLink.objects.select_related("user").get(link_token=token)
        except TelegramLink.DoesNotExist:
            bot_api.send_message(
                chat_id, "Link non valido o scaduto, generane uno nuovo dal sito"
            )
            return

        if link.chat_id is not None and link.chat_id != chat_id:
            bot_api.send_message(
                chat_id,
                "Questo link è già stato usato per collegare un altro account Telegram.",
            )
            return

        link.chat_id = chat_id
        link.is_active = True
        link.save()
        bot_api.send_message(
            chat_id,
            f"✅ Account collegato correttamente, {link.user.username}! Ora puoi usare /timer per...",
        )

    def _dispatch_command(self, message, text):
        chat_id = message.get("chat", {}).get("id")
        user = telegram_services.get_linked_user(chat_id)
        if user is None:
            bot_api.send_message(chat_id, NOT_LINKED_MESSAGE)
            return

        handler = getattr(self, self.COMMAND_HANDLERS[text])
        handler(user, chat_id)

    def _handle_timer(self, user, chat_id):
        active_entry = timesheet_services.get_active_timer(user)
        if active_entry is not None:
            elapsed = format_duration(active_entry.duration)
            bot_api.send_message(
                chat_id,
                f"Hai già un timer in corso su {active_entry.project.name} da {elapsed}.",
            )
            return

        projects = Project.objects.filter(is_archived=False)
        if not projects.exists():
            bot_api.send_message(chat_id, "Non ci sono progetti disponibili al momento.")
            return

        keyboard = [
            [{"text": project.name, "callback_data": f"start_project:{project.id}"}]
            for project in projects
        ]
        bot_api.send_message(
            chat_id, "Scegli il progetto:", reply_markup={"inline_keyboard": keyboard}
        )

    def _handle_stop(self, user, chat_id):
        active_entry = timesheet_services.get_active_timer(user)
        if active_entry is None:
            bot_api.send_message(chat_id, "Nessun timer attivo al momento")
            return

        entry = timesheet_services.stop_timer(user, time_entry_id=active_entry.id)
        duration = format_duration(entry.duration)
        description_suffix = f" — {entry.description}" if entry.description else ""
        bot_api.send_message(
            chat_id,
            f"⏹ Timer fermato su {entry.project.name}. Durata: {duration}{description_suffix}",
        )

    def _handle_oggi(self, user, chat_id):
        today = timezone.localdate()
        entries = (
            TimeEntry.objects.filter(user=user, start_time__date=today)
            .select_related("project")
            .order_by("start_time")
        )
        if not entries.exists():
            bot_api.send_message(chat_id, "Nessuna registrazione per oggi")
            return

        lines = [f"• {entry.project.name}: {format_duration(entry.duration)}" for entry in entries]
        total = sum((entry.duration for entry in entries), timedelta())
        lines.append(f"Totale: {format_duration(total)}")
        bot_api.send_message(chat_id, "\n".join(lines))

    def _handle_callback_query(self, callback_query):
        callback_query_id = callback_query.get("id")
        message = callback_query.get("message") or {}
        chat_id = message.get("chat", {}).get("id")
        data = callback_query.get("data") or ""

        user = telegram_services.get_linked_user(chat_id)
        if user is None:
            bot_api.send_message(chat_id, NOT_LINKED_MESSAGE)
        elif data.startswith("start_project:"):
            project_id = data.split(":", 1)[1]
            try:
                entry = timesheet_services.start_timer(user, project_id=project_id)
            except ValidationError as exc:
                bot_api.send_message(chat_id, exc.messages[0])
            else:
                start_label = timezone.localtime(entry.start_time).strftime("%H:%M")
                bot_api.send_message(
                    chat_id, f"▶️ Timer avviato su {entry.project.name} alle {start_label}."
                )

        bot_api.answer_callback_query(callback_query_id)


class TelegramLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        link, _ = TelegramLink.objects.get_or_create(user=request.user)
        return Response(TelegramLinkSerializer(link).data, status=200)
