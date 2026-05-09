from django.db import models

from apps.accounts.models import StudentProfile


class BudgetFinanceProfile(models.Model):
    student = models.OneToOneField(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="budget_finance",
    )
    scholarship_amount = models.DecimalField(max_digits=10, decimal_places=2)
    scholarship_status = models.CharField(max_length=255)
    next_funding_date = models.DateField()

    def __str__(self):
        return f"budget finance for {self.student.user.email}"


class PaidFinanceProfile(models.Model):
    student = models.OneToOneField(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="paid_finance",
    )
    tuition_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_debt = models.DecimalField(max_digits=10, decimal_places=2)
    payment_deadline = models.DateField()

    def __str__(self):
        return f"paid finance for {self.student.user.email}"


class PaymentRequisites(models.Model):
    receiver_name = models.CharField(max_length=255)
    iban = models.CharField(max_length=64)
    edrpou = models.CharField(max_length=32)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.receiver_name

