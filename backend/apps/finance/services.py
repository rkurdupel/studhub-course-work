from apps.accounts.models import StudentProfile

from .models import BudgetFinanceProfile, PaidFinanceProfile


SCHOLARSHIP_STATUS_ALIASES = {
    "academic": "академічна",
}


def normalize_scholarship_status(value):
    return SCHOLARSHIP_STATUS_ALIASES.get(value, value)


def create_finance_profile_for_registration(*, profile, finance_payload):
    if profile.funding_type == StudentProfile.FUNDING_TYPE_BUDGET:
        return BudgetFinanceProfile.objects.update_or_create(
            student=profile,
            defaults={
                "scholarship_amount": finance_payload["scholarship_amount"],
                "scholarship_status": normalize_scholarship_status(
                    finance_payload["scholarship_status"]
                ),
                "next_funding_date": finance_payload["next_funding_date"],
            },
        )

    return PaidFinanceProfile.objects.update_or_create(
        student=profile,
        defaults={
            "tuition_amount": finance_payload["tuition_amount"],
            "current_debt": finance_payload["current_debt"],
            "payment_deadline": finance_payload["payment_deadline"],
        },
    )
