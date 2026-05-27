from django.core.management.base import BaseCommand

from apps.chat.models import ChatGroup


DEFAULT_GROUPS = [
    {
        "code": "general",
        "display_name": "General",
        "group_type": ChatGroup.GROUP_TYPE_GENERAL,
        "is_read_only": False,
    },
    {
        "code": "reminders",
        "display_name": "Announcements",
        "group_type": ChatGroup.GROUP_TYPE_REMINDERS,
        "is_read_only": True,
    },
]


class Command(BaseCommand):
    help = "Create or update the default chat groups for the demo."

    def handle(self, *args, **kwargs):
        for group_data in DEFAULT_GROUPS:
            ChatGroup.objects.update_or_create(
                code=group_data["code"],
                defaults=group_data,
            )
