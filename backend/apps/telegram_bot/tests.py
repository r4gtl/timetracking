from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import TelegramLink

User = get_user_model()


@override_settings(TELEGRAM_WEBHOOK_SECRET="test-secret")
class TelegramWebhookViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("telegram-webhook")
        self.user = User.objects.create_user(username="mario", password="x")
        self.link = TelegramLink.objects.create(user=self.user)

    def _post(self, payload, secret="test-secret"):
        extra = {}
        if secret is not None:
            extra["HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN"] = secret
        return self.client.post(self.url, payload, format="json", **extra)

    def test_missing_secret_header_returns_403_and_no_db_change(self):
        response = self._post({"message": {"text": f"/start {self.link.link_token}"}}, secret=None)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.link.refresh_from_db()
        self.assertFalse(self.link.is_active)
        self.assertIsNone(self.link.chat_id)

    def test_wrong_secret_header_returns_403_and_no_db_change(self):
        response = self._post(
            {"message": {"text": f"/start {self.link.link_token}"}}, secret="wrong-secret"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.link.refresh_from_db()
        self.assertFalse(self.link.is_active)
        self.assertIsNone(self.link.chat_id)

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_start_with_valid_token_links_account(self, mock_send_message):
        payload = {
            "message": {
                "text": f"/start {self.link.link_token}",
                "chat": {"id": 999888777},
                "from": {"username": "mario_tg"},
            }
        }

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.link.refresh_from_db()
        self.assertTrue(self.link.is_active)
        self.assertEqual(self.link.chat_id, 999888777)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        self.assertEqual(call_args[0], 999888777)
        self.assertIn("mario", call_args[1])

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_start_with_unknown_token_sends_error_and_no_db_change(self, mock_send_message):
        payload = {
            "message": {
                "text": "/start does-not-exist",
                "chat": {"id": 111222333},
            }
        }

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.link.refresh_from_db()
        self.assertFalse(self.link.is_active)
        self.assertIsNone(self.link.chat_id)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        self.assertEqual(call_args[0], 111222333)

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_non_start_update_does_nothing(self, mock_send_message):
        payload = {
            "message": {
                "text": "hello there",
                "chat": {"id": 555},
            }
        }

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_not_called()
        self.link.refresh_from_db()
        self.assertFalse(self.link.is_active)
        self.assertIsNone(self.link.chat_id)
