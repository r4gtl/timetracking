import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _post(method: str, payload: dict) -> None:
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{method}"

    try:
        response = requests.post(url, data=payload, timeout=10)
    except requests.RequestException as exc:
        logger.warning("Errore di rete chiamando Telegram %s: %s", method, exc)
        return

    if not response.ok:
        logger.warning(
            "Telegram %s ha risposto con errore (status=%s): %s",
            method,
            response.status_code,
            response.text,
        )


def send_message(chat_id: int, text: str, reply_markup: dict | None = None) -> None:
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup is not None:
        payload["reply_markup"] = json.dumps(reply_markup)
    _post("sendMessage", payload)


def answer_callback_query(callback_query_id: str, text: str | None = None) -> None:
    payload = {"callback_query_id": callback_query_id}
    if text is not None:
        payload["text"] = text
    _post("answerCallbackQuery", payload)
