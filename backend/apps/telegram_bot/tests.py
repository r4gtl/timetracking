from datetime import datetime, time, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.clients.models import Client
from apps.projects.models import Project
from apps.timesheet.models import TimeEntry

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


@override_settings(TELEGRAM_WEBHOOK_SECRET="test-secret")
class TelegramBotCommandsTests(APITestCase):
    def setUp(self):
        self.url = reverse("telegram-webhook")
        self.chat_id = 42424242
        self.user = User.objects.create_user(username="mario", password="x")
        TelegramLink.objects.create(user=self.user, chat_id=self.chat_id, is_active=True)
        self.client_obj = Client.objects.create(name="Acme")
        self.project = Project.objects.create(name="Website", client=self.client_obj)

    def _post(self, payload):
        return self.client.post(
            self.url,
            payload,
            format="json",
            HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN="test-secret",
        )

    def _today_at(self, hour, minute):
        return timezone.make_aware(datetime.combine(timezone.localdate(), time(hour, minute)))

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_timer_without_linked_account_invites_to_link(self, mock_send_message):
        unlinked_chat_id = 1
        payload = {"message": {"text": "/timer", "chat": {"id": unlinked_chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        self.assertEqual(call_args[0], unlinked_chat_id)
        self.assertIn("collegat", call_args[1])
        self.assertEqual(TimeEntry.objects.count(), 0)

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_timer_with_active_timer_reports_progress_and_creates_nothing(self, mock_send_message):
        active_entry = TimeEntry.objects.create(
            user=self.user,
            project=self.project,
            start_time=timezone.now() - timedelta(hours=1, minutes=23),
            end_time=None,
        )
        payload = {"message": {"text": "/timer", "chat": {"id": self.chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        self.assertEqual(call_args[0], self.chat_id)
        self.assertIn(self.project.name, call_args[1])
        self.assertIn("1h 23m", call_args[1])
        self.assertEqual(mock_send_message.call_args.kwargs.get("reply_markup"), None)
        self.assertEqual(TimeEntry.objects.count(), 1)
        active_entry.refresh_from_db()
        self.assertIsNone(active_entry.end_time)

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_timer_without_active_timer_sends_project_keyboard(self, mock_send_message):
        payload = {"message": {"text": "/timer", "chat": {"id": self.chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        call_kwargs = mock_send_message.call_args.kwargs
        self.assertEqual(call_args[0], self.chat_id)
        keyboard = call_kwargs["reply_markup"]["inline_keyboard"]
        self.assertEqual(
            keyboard, [[{"text": "Website", "callback_data": f"start_project:{self.project.id}"}]]
        )

    @patch("apps.telegram_bot.views.bot_api.answer_callback_query")
    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_callback_query_start_project_creates_timer_and_answers(
        self, mock_send_message, mock_answer_callback_query
    ):
        payload = {
            "callback_query": {
                "id": "callback-1",
                "data": f"start_project:{self.project.id}",
                "message": {"chat": {"id": self.chat_id}},
            }
        }

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entry = TimeEntry.objects.get(user=self.user, project=self.project)
        self.assertIsNone(entry.end_time)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        self.assertEqual(call_args[0], self.chat_id)
        self.assertIn(self.project.name, call_args[1])
        mock_answer_callback_query.assert_called_once_with("callback-1")

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_stop_with_active_timer_stops_and_confirms(self, mock_send_message):
        entry = TimeEntry.objects.create(
            user=self.user,
            project=self.project,
            description="Bugfix",
            start_time=timezone.now() - timedelta(minutes=45),
            end_time=None,
        )
        payload = {"message": {"text": "/stop", "chat": {"id": self.chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entry.refresh_from_db()
        self.assertIsNotNone(entry.end_time)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        self.assertEqual(call_args[0], self.chat_id)
        self.assertIn(self.project.name, call_args[1])
        self.assertIn("45m", call_args[1])
        self.assertIn("Bugfix", call_args[1])

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_stop_without_active_timer_sends_message_and_changes_nothing(self, mock_send_message):
        payload = {"message": {"text": "/stop", "chat": {"id": self.chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_called_once_with(self.chat_id, "Nessun timer attivo al momento")
        self.assertEqual(TimeEntry.objects.count(), 0)

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_oggi_without_entries_sends_message(self, mock_send_message):
        payload = {"message": {"text": "/oggi", "chat": {"id": self.chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_called_once_with(self.chat_id, "Nessuna registrazione per oggi")

    @patch("apps.telegram_bot.views.bot_api.send_message")
    def test_oggi_with_entries_sends_summary_with_total(self, mock_send_message):
        second_project = Project.objects.create(name="Support", client=self.client_obj)
        TimeEntry.objects.create(
            user=self.user,
            project=self.project,
            start_time=self._today_at(9, 0),
            end_time=self._today_at(10, 0),
        )
        TimeEntry.objects.create(
            user=self.user,
            project=second_project,
            start_time=self._today_at(11, 0),
            end_time=self._today_at(11, 30),
        )
        payload = {"message": {"text": "/oggi", "chat": {"id": self.chat_id}}}

        response = self._post(payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_message.assert_called_once()
        call_args = mock_send_message.call_args.args
        text = call_args[1]
        self.assertIn(self.project.name, text)
        self.assertIn(second_project.name, text)
        self.assertIn("1h", text)
        self.assertIn("30m", text)
        self.assertIn("Totale: 1h 30m", text)
