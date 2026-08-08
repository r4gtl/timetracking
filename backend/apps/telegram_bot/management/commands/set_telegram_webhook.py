import requests
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Registra l'URL del webhook Telegram tramite la Bot API setWebhook."

    def add_arguments(self, parser):
        parser.add_argument(
            "public_https_url",
            help="URL pubblico https del backend, es. https://api.example.com",
        )

    def handle(self, *args, **options):
        public_https_url = options["public_https_url"].rstrip("/")
        webhook_url = f"{public_https_url}/api/telegram/webhook/"

        api_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/setWebhook"
        payload = {
            "url": webhook_url,
            "secret_token": settings.TELEGRAM_WEBHOOK_SECRET,
        }

        try:
            response = requests.post(api_url, data=payload, timeout=10)
            result = response.json()
        except requests.RequestException as exc:
            self.stdout.write(self.style.ERROR(f"Errore di rete contattando Telegram: {exc}"))
            return

        if response.ok and result.get("ok"):
            self.stdout.write(self.style.SUCCESS(f"Webhook impostato correttamente su {webhook_url}"))
            self.stdout.write(str(result.get("description", "")))
        else:
            self.stdout.write(self.style.ERROR(
                f"Errore impostando il webhook: {result.get('description', response.text)}"
            ))
