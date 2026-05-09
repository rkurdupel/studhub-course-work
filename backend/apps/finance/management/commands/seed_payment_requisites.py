from django.core.management.base import BaseCommand

from apps.finance.models import PaymentRequisites


class Command(BaseCommand):
    help = "Create or update the default payment requisites for demo paid students."

    def handle(self, *args, **kwargs):
        PaymentRequisites.objects.update_or_create(
            is_active=True,
            defaults={
                "receiver_name": "University Treasury",
                "iban": "UA123456789012345678901234567",
                "edrpou": "12345678",
            },
        )

