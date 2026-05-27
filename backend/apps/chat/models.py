from django.db import models

from apps.accounts.models import StudentProfile, User


class ChatGroup(models.Model):
    GROUP_TYPE_GENERAL = "general"
    GROUP_TYPE_REMINDERS = "reminders"
    GROUP_TYPE_STUDY_GROUP = "study_group"
    GROUP_TYPE_DIRECT = "direct"
    GROUP_TYPE_CHOICES = (
        (GROUP_TYPE_GENERAL, "General"),
        (GROUP_TYPE_REMINDERS, "Reminders"),
        (GROUP_TYPE_STUDY_GROUP, "Study Group"),
        (GROUP_TYPE_DIRECT, "Direct"),
    )

    code = models.SlugField(unique=True)
    display_name = models.CharField(max_length=255)
    group_type = models.CharField(max_length=30, choices=GROUP_TYPE_CHOICES)
    is_read_only = models.BooleanField(default=False)

    class Meta:
        ordering = ("display_name",)

    def __str__(self):
        return self.display_name


class ChatMembership(models.Model):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="chat_memberships",
    )
    group = models.ForeignKey(
        ChatGroup,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("student", "group"), name="unique_student_group_membership")
        ]

    def __str__(self):
        return f"{self.student.user.email} in {self.group.code}"


class ChatMessage(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField(blank=True)
    image = models.FileField(upload_to="chat_images/", blank=True, null=True)
    attachment = models.FileField(upload_to="chat_files/", blank=True, null=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")

    def __str__(self):
        return f"message {self.pk} in {self.group.code}"


class Reminder(ChatMessage):
    class Meta:
        proxy = True
        verbose_name = "Announcements"
        verbose_name_plural = "Announcements"
