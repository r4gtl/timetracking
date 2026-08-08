from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import bot_api
from .models import TelegramLink


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if secret != settings.TELEGRAM_WEBHOOK_SECRET:
            return Response({"detail": "Forbidden"}, status=403)

        update = request.data if isinstance(request.data, dict) else {}
        message = update.get("message")
        text = message.get("text") if isinstance(message, dict) else None

        if isinstance(text, str) and text.startswith("/start"):
            self._handle_start(message, text)

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
