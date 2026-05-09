from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The email address must be set.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()


class StudentProfile(models.Model):
    FUNDING_TYPE_BUDGET = "budget"
    FUNDING_TYPE_PAID = "paid"
    FUNDING_TYPE_CHOICES = (
        (FUNDING_TYPE_BUDGET, "Budget"),
        (FUNDING_TYPE_PAID, "Paid"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    full_name = models.CharField(max_length=255, blank=True, default="")
    course = models.CharField(max_length=32)
    specialization = models.CharField(max_length=64)
    funding_type = models.CharField(max_length=32, choices=FUNDING_TYPE_CHOICES)

    def __str__(self):
        return f"{self.user.email} profile"


class RegistrationFinancePayload(models.Model):
    profile = models.OneToOneField(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="registration_finance_payload",
    )
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"registration finance payload for {self.profile.user.email}"
