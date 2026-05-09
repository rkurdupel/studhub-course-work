# Student Platform Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Django + DRF + PostgreSQL backend for the STUD HUB demo with student auth, profile/finance APIs, fixed subjects with admin-uploaded files, simple polling chat with image attachments, a rule-based assistant endpoint, and Docker-based deployment.

**Architecture:** Use one Django project with focused apps: `accounts`, `finance`, `subjects`, `chat`, and `assistant`. Expose student-facing JSON APIs through DRF with JWT auth, use Django admin for subject material management, and store uploaded files in a mounted media directory. Keep reminders read-only and seed fixed subjects/chat groups for demo readiness.

**Tech Stack:** Django, Django REST Framework, djangorestframework-simplejwt, PostgreSQL, psycopg, Pillow, pytest, pytest-django, Docker, Docker Compose

---

## File Structure

### New backend root

- Create: `backend/`
- Create: `backend/manage.py`
- Create: `backend/pyproject.toml`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/Dockerfile`
- Create: `backend/docker-compose.yml`
- Create: `backend/.dockerignore`

### Django project package

- Create: `backend/config/__init__.py`
- Create: `backend/config/settings.py`
- Create: `backend/config/urls.py`
- Create: `backend/config/wsgi.py`
- Create: `backend/config/asgi.py`

### Django apps

- Create: `backend/apps/accounts/...`
- Create: `backend/apps/finance/...`
- Create: `backend/apps/subjects/...`
- Create: `backend/apps/chat/...`
- Create: `backend/apps/assistant/...`

### Shared / tests

- Create: `backend/apps/common/` if a shared helpers module is needed
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/accounts/`
- Create: `backend/tests/finance/`
- Create: `backend/tests/subjects/`
- Create: `backend/tests/chat/`
- Create: `backend/tests/assistant/`

### Seed / operational files

- Create: `backend/apps/subjects/management/commands/seed_subjects.py`
- Create: `backend/apps/chat/management/commands/seed_chat_groups.py`
- Create: `backend/apps/finance/management/commands/seed_payment_requisites.py`

## Task 1: Scaffold Django Project and Runtime

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/manage.py`
- Create: `backend/config/settings.py`
- Create: `backend/config/urls.py`
- Create: `backend/config/wsgi.py`
- Create: `backend/config/asgi.py`
- Create: `backend/.env.example`
- Create: `backend/Dockerfile`
- Create: `backend/docker-compose.yml`
- Test: `backend/tests/test_settings_smoke.py`

- [ ] **Step 1: Write the failing environment smoke test**

```python
# backend/tests/test_settings_smoke.py
import pytest
from django.conf import settings


@pytest.mark.django_db
def test_installed_apps_include_rest_framework():
    assert "rest_framework" in settings.INSTALLED_APPS
    assert settings.AUTH_USER_MODEL == "accounts.User"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_settings_smoke.py -v`
Expected: FAIL with import/settings errors because the Django project does not exist yet.

- [ ] **Step 3: Write minimal project bootstrap**

```python
# backend/config/settings.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "apps.accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
AUTH_USER_MODEL = "accounts.User"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "studhub"),
        "USER": os.getenv("POSTGRES_USER", "studhub"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "studhub"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}
STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
```

- [ ] **Step 4: Add container/runtime files**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

```yaml
# backend/docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: studhub
      POSTGRES_USER: studhub
      POSTGRES_PASSWORD: studhub
    volumes:
      - postgres_data:/var/lib/postgresql/data
  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - .:/app
      - ./media:/app/media
    depends_on:
      - db
volumes:
  postgres_data:
```

- [ ] **Step 5: Run the smoke test to verify it passes**

Run: `cd backend && pytest tests/test_settings_smoke.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "chore: scaffold django backend runtime"
```

## Task 2: Implement Accounts and Registration Flow

**Files:**
- Create: `backend/apps/accounts/models.py`
- Create: `backend/apps/accounts/serializers.py`
- Create: `backend/apps/accounts/views.py`
- Create: `backend/apps/accounts/urls.py`
- Create: `backend/tests/accounts/test_registration_api.py`
- Modify: `backend/config/settings.py`
- Modify: `backend/config/urls.py`
- Test: `backend/tests/accounts/test_registration_api.py`

- [ ] **Step 1: Write the failing registration test**

```python
# backend/tests/accounts/test_registration_api.py
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, StudentProfile


@pytest.mark.django_db
def test_register_budget_student_creates_profile():
    client = APIClient()
    payload = {
        "full_name": "Іван Петренко",
        "email": "ivan@example.com",
        "password": "StrongPass123!",
        "course": "1",
        "specialization": "СА",
        "funding_type": "budget",
        "scholarship_amount": "2000.00",
        "scholarship_status": "академічна",
        "next_funding_date": "2026-06-01",
    }

    response = client.post("/api/auth/register/", payload, format="json")

    assert response.status_code == 201
    assert User.objects.filter(email="ivan@example.com").exists()
    profile = StudentProfile.objects.get(user__email="ivan@example.com")
    assert profile.funding_type == "budget"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/accounts/test_registration_api.py::test_register_budget_student_creates_profile -v`
Expected: FAIL because `User`, `StudentProfile`, and `/api/auth/register/` do not exist.

- [ ] **Step 3: Implement custom user and student profile**

```python
# backend/apps/accounts/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()


class StudentProfile(models.Model):
    FUNDING_TYPES = [("budget", "Бюджет"), ("paid", "Платне")]
    SPECIALIZATIONS = [("СА", "СА"), ("КН", "КН"), ("ІПЗ", "ІПЗ")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    full_name = models.CharField(max_length=255)
    course = models.CharField(max_length=1)
    specialization = models.CharField(max_length=10, choices=SPECIALIZATIONS)
    funding_type = models.CharField(max_length=20, choices=FUNDING_TYPES)
```

- [ ] **Step 4: Implement registration serializer and view with transaction hook points**

```python
# backend/apps/accounts/serializers.py
from django.db import transaction
from rest_framework import serializers
from apps.accounts.models import User, StudentProfile
from apps.finance.services import create_finance_profile_for_registration
from apps.chat.services import assign_default_chat_memberships


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    course = serializers.CharField()
    specialization = serializers.CharField()
    funding_type = serializers.ChoiceField(choices=["budget", "paid"])
    scholarship_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    scholarship_status = serializers.CharField(required=False)
    next_funding_date = serializers.DateField(required=False)
    tuition_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    current_debt = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    payment_deadline = serializers.DateField(required=False)

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
            )
            profile = StudentProfile.objects.create(
                user=user,
                full_name=validated_data["full_name"],
                course=validated_data["course"],
                specialization=validated_data["specialization"],
                funding_type=validated_data["funding_type"],
            )
            create_finance_profile_for_registration(profile, validated_data)
            assign_default_chat_memberships(profile)
            return user
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/accounts/test_registration_api.py::test_register_budget_student_creates_profile -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/apps/accounts backend/config backend/tests/accounts
git commit -m "feat: add student registration and profile flow"
```

## Task 3: Add Finance Models and Finance API

**Files:**
- Create: `backend/apps/finance/models.py`
- Create: `backend/apps/finance/services.py`
- Create: `backend/apps/finance/serializers.py`
- Create: `backend/apps/finance/views.py`
- Create: `backend/apps/finance/urls.py`
- Create: `backend/tests/finance/test_finance_api.py`
- Modify: `backend/config/settings.py`
- Modify: `backend/config/urls.py`
- Test: `backend/tests/finance/test_finance_api.py`

- [ ] **Step 1: Write the failing finance response test**

```python
# backend/tests/finance/test_finance_api.py
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, StudentProfile
from apps.finance.models import BudgetFinanceProfile


@pytest.mark.django_db
def test_budget_student_gets_budget_finance_payload():
    user = User.objects.create_user(email="budget@example.com", password="StrongPass123!")
    profile = StudentProfile.objects.create(
        user=user,
        full_name="Бюджет Студент",
        course="2",
        specialization="КН",
        funding_type="budget",
    )
    BudgetFinanceProfile.objects.create(
        student=profile,
        scholarship_amount="2500.00",
        scholarship_status="академічна",
        next_funding_date="2026-06-01",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/finance/")

    assert response.status_code == 200
    assert response.json()["funding_type"] == "budget"
    assert response.json()["scholarship_amount"] == "2500.00"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/finance/test_finance_api.py::test_budget_student_gets_budget_finance_payload -v`
Expected: FAIL because finance models and endpoint do not exist.

- [ ] **Step 3: Implement finance models and service helpers**

```python
# backend/apps/finance/models.py
from django.db import models
from apps.accounts.models import StudentProfile


class BudgetFinanceProfile(models.Model):
    student = models.OneToOneField(StudentProfile, on_delete=models.CASCADE, related_name="budget_finance")
    scholarship_amount = models.DecimalField(max_digits=10, decimal_places=2)
    scholarship_status = models.CharField(max_length=255)
    next_funding_date = models.DateField()


class PaidFinanceProfile(models.Model):
    student = models.OneToOneField(StudentProfile, on_delete=models.CASCADE, related_name="paid_finance")
    tuition_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_debt = models.DecimalField(max_digits=10, decimal_places=2)
    payment_deadline = models.DateField()


class PaymentRequisites(models.Model):
    receiver_name = models.CharField(max_length=255)
    iban = models.CharField(max_length=64)
    edrpou = models.CharField(max_length=32)
    is_active = models.BooleanField(default=True)
```

- [ ] **Step 4: Implement `GET /api/finance/`**

```python
# backend/apps/finance/views.py
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class FinanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.student_profile
        if profile.funding_type == "budget":
            finance = profile.budget_finance
            return Response(
                {
                    "funding_type": "budget",
                    "scholarship_amount": f"{finance.scholarship_amount:.2f}",
                    "scholarship_status": finance.scholarship_status,
                    "next_funding_date": finance.next_funding_date.isoformat(),
                }
            )
        finance = profile.paid_finance
        requisites = PaymentRequisites.objects.filter(is_active=True).first()
        return Response(
            {
                "funding_type": "paid",
                "tuition_amount": f"{finance.tuition_amount:.2f}",
                "current_debt": f"{finance.current_debt:.2f}",
                "payment_deadline": finance.payment_deadline.isoformat(),
                "payment_requisites": {
                    "receiver_name": requisites.receiver_name if requisites else "",
                    "iban": requisites.iban if requisites else "",
                    "edrpou": requisites.edrpou if requisites else "",
                },
            }
        )
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/finance/test_finance_api.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/apps/finance backend/tests/finance
git commit -m "feat: add finance models and api"
```

## Task 4: Add Fixed Subjects, Admin Material Uploads, and Student Material APIs

**Files:**
- Create: `backend/apps/subjects/models.py`
- Create: `backend/apps/subjects/admin.py`
- Create: `backend/apps/subjects/views.py`
- Create: `backend/apps/subjects/urls.py`
- Create: `backend/apps/subjects/management/commands/seed_subjects.py`
- Create: `backend/tests/subjects/test_materials_api.py`
- Modify: `backend/config/settings.py`
- Modify: `backend/config/urls.py`
- Test: `backend/tests/subjects/test_materials_api.py`

- [ ] **Step 1: Write the failing subject materials listing test**

```python
# backend/tests/subjects/test_materials_api.py
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.subjects.models import Subject, SubjectMaterial


@pytest.mark.django_db
def test_student_can_list_materials_for_subject():
    user = User.objects.create_user(email="student@example.com", password="StrongPass123!")
    subject = Subject.objects.create(slug="math", name="Вища математика")
    SubjectMaterial.objects.create(
        subject=subject,
        title="Лекція 1",
        file=SimpleUploadedFile("lecture1.pdf", b"pdf-bytes", content_type="application/pdf"),
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/subjects/math/materials/")

    assert response.status_code == 200
    assert response.json()[0]["title"] == "Лекція 1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/subjects/test_materials_api.py::test_student_can_list_materials_for_subject -v`
Expected: FAIL because subject models and endpoint do not exist.

- [ ] **Step 3: Implement subject/material models and admin registration**

```python
# backend/apps/subjects/models.py
from django.db import models


class Subject(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)


class SubjectMaterial(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="materials")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="subject_materials/")
    file_size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.file and hasattr(self.file, "size"):
            self.file_size = self.file.size
        super().save(*args, **kwargs)
```

- [ ] **Step 4: Implement list/open/download endpoints**

```python
# backend/apps/subjects/views.py
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from apps.subjects.models import Subject, SubjectMaterial
from apps.subjects.serializers import SubjectMaterialSerializer


class SubjectMaterialListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectMaterialSerializer

    def get_queryset(self):
        subject = get_object_or_404(Subject, slug=self.kwargs["slug"])
        return subject.materials.order_by("-uploaded_at")


def material_download_view(request, pk):
    material = get_object_or_404(SubjectMaterial, pk=pk)
    return FileResponse(material.file.open("rb"), as_attachment=True, filename=material.file.name.split("/")[-1])
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/subjects/test_materials_api.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/apps/subjects backend/tests/subjects
git commit -m "feat: add subject materials and admin uploads"
```

## Task 5: Add Predefined Chat Groups, Memberships, Messages, and Image Uploads

**Files:**
- Create: `backend/apps/chat/models.py`
- Create: `backend/apps/chat/services.py`
- Create: `backend/apps/chat/serializers.py`
- Create: `backend/apps/chat/views.py`
- Create: `backend/apps/chat/urls.py`
- Create: `backend/apps/chat/management/commands/seed_chat_groups.py`
- Create: `backend/tests/chat/test_chat_api.py`
- Modify: `backend/config/settings.py`
- Modify: `backend/config/urls.py`
- Test: `backend/tests/chat/test_chat_api.py`

- [ ] **Step 1: Write the failing reminder-post rejection test**

```python
# backend/tests/chat/test_chat_api.py
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, StudentProfile
from apps.chat.models import ChatGroup, ChatMembership


@pytest.mark.django_db
def test_student_cannot_post_to_reminders_group():
    user = User.objects.create_user(email="student@example.com", password="StrongPass123!")
    profile = StudentProfile.objects.create(
        user=user,
        full_name="Тест Студент",
        course="1",
        specialization="СА",
        funding_type="budget",
    )
    group = ChatGroup.objects.create(code="reminders", display_name="Нагадування", group_type="reminders", is_read_only=True)
    ChatMembership.objects.create(student=profile, group=group)
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(f"/api/chat/groups/{group.id}/messages/", {"text": "Привіт"}, format="json")

    assert response.status_code == 403
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/chat/test_chat_api.py::test_student_cannot_post_to_reminders_group -v`
Expected: FAIL because chat models and endpoint do not exist.

- [ ] **Step 3: Implement chat models and membership service**

```python
# backend/apps/chat/models.py
from django.db import models
from apps.accounts.models import StudentProfile, User


class ChatGroup(models.Model):
    GROUP_TYPES = [("general", "general"), ("reminders", "reminders"), ("study_group", "study_group")]
    code = models.SlugField(unique=True)
    display_name = models.CharField(max_length=255)
    group_type = models.CharField(max_length=30, choices=GROUP_TYPES)
    is_read_only = models.BooleanField(default=False)


class ChatMembership(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="chat_memberships")
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name="memberships")


class ChatMessage(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

- [ ] **Step 4: Implement message post/list/latest/image endpoints**

```python
# backend/apps/chat/views.py
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.chat.models import ChatGroup, ChatMembership, ChatMessage


class ChatMessageCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(ChatGroup, pk=group_id)
        membership = ChatMembership.objects.filter(group=group, student=request.user.student_profile).exists()
        if not membership:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if group.is_read_only:
            return Response({"detail": "Read-only group"}, status=status.HTTP_403_FORBIDDEN)
        message = ChatMessage.objects.create(group=group, sender=request.user, text=request.data.get("text", ""))
        return Response({"id": message.id, "text": message.text}, status=status.HTTP_201_CREATED)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/chat/test_chat_api.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/apps/chat backend/tests/chat
git commit -m "feat: add polling chat and image attachments"
```

## Task 6: Add Assistant Endpoint and Seed Commands

**Files:**
- Create: `backend/apps/assistant/views.py`
- Create: `backend/apps/assistant/urls.py`
- Create: `backend/apps/assistant/services.py`
- Create: `backend/tests/assistant/test_assistant_api.py`
- Create: `backend/apps/finance/management/commands/seed_payment_requisites.py`
- Test: `backend/tests/assistant/test_assistant_api.py`

- [ ] **Step 1: Write the failing assistant response test**

```python
# backend/tests/assistant/test_assistant_api.py
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, StudentProfile
from apps.finance.models import PaidFinanceProfile


@pytest.mark.django_db
def test_assistant_answers_about_debt_for_paid_student():
    user = User.objects.create_user(email="paid@example.com", password="StrongPass123!")
    profile = StudentProfile.objects.create(
        user=user,
        full_name="Контракт Студент",
        course="3",
        specialization="ІПЗ",
        funding_type="paid",
    )
    PaidFinanceProfile.objects.create(
        student=profile,
        tuition_amount="15000.00",
        current_debt="5000.00",
        payment_deadline="2026-05-15",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/assistant/chat/", {"message": "Який у мене борг?"}, format="json")

    assert response.status_code == 200
    assert "5000" in response.json()["response"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/assistant/test_assistant_api.py::test_assistant_answers_about_debt_for_paid_student -v`
Expected: FAIL because assistant endpoint does not exist.

- [ ] **Step 3: Implement deterministic assistant service**

```python
# backend/apps/assistant/services.py
def build_assistant_response(profile, message):
    text = message.lower()
    if "борг" in text or "оплат" in text:
        if profile.funding_type == "paid":
            finance = profile.paid_finance
            return (
                f"Ваш поточний борг складає {finance.current_debt} грн. "
                f"Дедлайн оплати: {finance.payment_deadline:%d.%m.%Y}."
            )
        return "Ви навчаєтесь на бюджетній формі, тому оплата за навчання для вас не застосовується."
    if "стипен" in text:
        if profile.funding_type == "budget":
            finance = profile.budget_finance
            return (
                f"Розмір стипендії: {finance.scholarship_amount} грн. "
                f"Наступна дата виплати: {finance.next_funding_date:%d.%m.%Y}."
            )
        return "Студенти на платній формі навчання не отримують університетську стипендію."
    return "Спробуйте уточнити питання про оплату, стипендію, дедлайни або реквізити."
```

- [ ] **Step 4: Add seed commands for subjects, chat groups, and requisites**

```python
# backend/apps/subjects/management/commands/seed_subjects.py
from django.core.management.base import BaseCommand
from apps.subjects.models import Subject

SUBJECTS = [
    ("math", "Вища математика"),
    ("physics", "Фізика"),
    ("programming", "Програмування"),
    ("algorithms", "Алгоритми"),
    ("databases", "Бази даних"),
    ("networks", "Комп'ютерні мережі"),
]


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        for index, (slug, name) in enumerate(SUBJECTS, start=1):
            Subject.objects.update_or_create(slug=slug, defaults={"name": name, "sort_order": index})
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/assistant/test_assistant_api.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/apps/assistant backend/apps/subjects/management backend/apps/finance/management
git commit -m "feat: add assistant endpoint and seed commands"
```

## Task 7: Wire Admin, Migrations, and End-to-End Container Verification

**Files:**
- Modify: `backend/apps/subjects/admin.py`
- Modify: `backend/apps/accounts/admin.py`
- Modify: `backend/config/urls.py`
- Create: `backend/tests/test_end_to_end_smoke.py`
- Modify: `backend/docker-compose.yml`
- Test: `backend/tests/test_end_to_end_smoke.py`

- [ ] **Step 1: Write the failing smoke test**

```python
# backend/tests/test_end_to_end_smoke.py
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_api_me_requires_authentication():
    client = APIClient()
    response = client.get("/api/auth/me/")
    assert response.status_code == 401
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_end_to_end_smoke.py -v`
Expected: FAIL if `/api/auth/me/` is not yet wired correctly.

- [ ] **Step 3: Finish admin registrations and route wiring**

```python
# backend/config/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/finance/", include("apps.finance.urls")),
    path("api/subjects/", include("apps.subjects.urls")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/assistant/", include("apps.assistant.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 4: Run all backend tests and container checks**

Run: `cd backend && pytest -v`
Expected: PASS

Run: `cd backend && python manage.py makemigrations`
Expected: migration files created for all apps

Run: `cd backend && python manage.py migrate`
Expected: all migrations applied successfully

Run: `cd backend && python manage.py seed_subjects && python manage.py seed_chat_groups && python manage.py seed_payment_requisites`
Expected: seed data created or updated

Run: `cd backend && docker compose up --build`
Expected: Django and PostgreSQL start successfully, API available on `http://localhost:8000`

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat: finalize backend wiring and deployment setup"
```

## Self-Review

- Spec coverage check:
  - auth/profile covered by Task 2
  - finance covered by Task 3
  - fixed subjects and admin uploads covered by Task 4
  - polling chat and reminders rules covered by Task 5
  - assistant covered by Task 6
  - Docker and EC2-oriented runtime skeleton covered by Tasks 1 and 7
- Placeholder scan:
  - no `TBD` or `TODO`
  - every task includes concrete files, commands, and code
- Type consistency:
  - funding types remain `budget` and `paid`
  - subject slug-based APIs remain under `/api/subjects/...`
  - reminders stay read-only through `is_read_only`
