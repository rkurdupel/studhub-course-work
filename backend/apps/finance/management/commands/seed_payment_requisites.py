from django.core.management.base import BaseCommand

from apps.finance.models import PaymentRequisites


class Command(BaseCommand):
    help = "Create or update the default payment requisites for demo paid students"

    def handle(self, *args, **kwargs):
        PaymentRequisites.objects.update_or_create(
            is_active=True,
            defaults={
                "receiver_name": "Львівська Політехніка",
                "iban": "UA388201720313241002201001057",
                "edrpou": "02071010",
            },
        )

