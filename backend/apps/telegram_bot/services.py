from .models import TelegramLink


def get_linked_user(chat_id):
    link = TelegramLink.objects.select_related("user").filter(
        chat_id=chat_id, is_active=True
    ).first()
    return link.user if link is not None else None
