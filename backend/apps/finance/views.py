from decimal import Decimal

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import StudentProfile

from .models import PaymentRequisites
from .services import normalize_scholarship_status


def format_money(value):
    return f"{Decimal(str(value)):.2f}"


class FinanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.student_profile
        if profile.funding_type == StudentProfile.FUNDING_TYPE_BUDGET:
            finance = profile.budget_finance
            return Response(
                {
                    "funding_type": "budget",
                    "scholarship_amount": format_money(finance.scholarship_amount),
                    "scholarship_status": normalize_scholarship_status(finance.scholarship_status),
                    "next_funding_date": finance.next_funding_date,
                }
            )

        finance = profile.paid_finance
        requisites = PaymentRequisites.objects.filter(is_active=True).first()
        return Response(
            {
                "funding_type": "paid",
                "tuition_amount": format_money(finance.tuition_amount),
                "current_debt": format_money(finance.current_debt),
                "payment_deadline": finance.payment_deadline,
                "payment_requisites": {
                    "receiver_name": requisites.receiver_name if requisites else "",
                    "iban": requisites.iban if requisites else "",
                    "edrpou": requisites.edrpou if requisites else "",
                },
            }
        )
