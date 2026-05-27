from django.contrib import admin

from .models import ChatGroup, ChatMessage, Reminder


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    fields = ("text", "image", "attachment", "created_at")
    list_display = ("short_text", "created_at", "has_attachment")
    readonly_fields = ("created_at",)
    search_fields = ("text",)
    ordering = ("-created_at",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.filter(group__group_type=ChatGroup.GROUP_TYPE_REMINDERS)

    def save_model(self, request, obj, form, change):
        group, _created = ChatGroup.objects.get_or_create(
            code="reminders",
            defaults={
                "display_name": "Announcements",
                "group_type": ChatGroup.GROUP_TYPE_REMINDERS,
                "is_read_only": True,
            },
        )
        if (
            group.display_name != "Announcements"
            or group.group_type != ChatGroup.GROUP_TYPE_REMINDERS
            or not group.is_read_only
        ):
            group.display_name = "Announcements"
            group.group_type = ChatGroup.GROUP_TYPE_REMINDERS
            group.is_read_only = True
            group.save(update_fields=("display_name", "group_type", "is_read_only"))

        obj.group = group
        obj.sender = None
        obj.is_system = True
        super().save_model(request, obj, form, change)

    @admin.display(description="Reminder")
    def short_text(self, obj):
        if len(obj.text) <= 80:
            return obj.text
        return f"{obj.text[:77]}..."

    @admin.display(boolean=True, description="Image")
    def has_attachment(self, obj):
        return bool(obj.image or obj.attachment)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    fields = ("group", "text", "image", "attachment", "created_at")
    list_display = ("group", "short_text", "created_at", "has_attachment")
    list_filter = ("group",)
    readonly_fields = ("created_at",)
    search_fields = ("text", "group__display_name", "group__code")
    ordering = ("-created_at",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("group").exclude(group__group_type=ChatGroup.GROUP_TYPE_REMINDERS)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "group":
            kwargs["queryset"] = ChatGroup.objects.exclude(group_type=ChatGroup.GROUP_TYPE_REMINDERS)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        obj.sender = None
        obj.is_system = True
        super().save_model(request, obj, form, change)

    @admin.display(description="Message")
    def short_text(self, obj):
        if len(obj.text) <= 80:
            return obj.text
        return f"{obj.text[:77]}..."

    @admin.display(boolean=True, description="Image")
    def has_attachment(self, obj):
        return bool(obj.image or obj.attachment)
