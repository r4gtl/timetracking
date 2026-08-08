import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def send_message(chat_id: int, text: str, reply_markup: dict | None = None) -> None:
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup)

    try:
        response = requests.post(url, data=payload, timeout=10)
    except requests.RequestException as exc:
        logger.warning("Errore di rete inviando il messaggio Telegram: %s", exc)
        return

    if not response.ok:
        logger.warning(
            "Telegram sendMessage ha risposto con errore (status=%s): %s",
            response.status_code,
            response.text,
        )
