from apps.accounts.models import StudentProfile

from .models import ChatGroup, ChatMembership


DEFAULT_GROUPS = (
    {
        "code": "reminders",
        "display_name": "Announcements",
        "group_type": ChatGroup.GROUP_TYPE_REMINDERS,
        "is_read_only": True,
    },
    {
        "code": "general",
        "display_name": "Загальний чат",
        "group_type": ChatGroup.GROUP_TYPE_GENERAL,
        "is_read_only": False,
    },
)


def assign_default_chat_memberships(*, user, profile):
    memberships = []
    for group_data in DEFAULT_GROUPS:
        group, _created = ChatGroup.objects.get_or_create(
            code=group_data["code"],
            defaults=group_data,
        )
        membership, _created = ChatMembership.objects.get_or_create(student=profile, group=group)
        memberships.append(membership)

    specialization_code = profile.specialization.strip().lower().replace(" ", "-")
    specialization_group, _created = ChatGroup.objects.get_or_create(
        code=f"specialization-{specialization_code}",
        defaults={
            "display_name": profile.specialization,
            "group_type": ChatGroup.GROUP_TYPE_GENERAL,
            "is_read_only": False,
        },
    )
    if specialization_group.display_name != profile.specialization:
        specialization_group.display_name = profile.specialization
        specialization_group.save(update_fields=("display_name",))

    membership, _created = ChatMembership.objects.get_or_create(student=profile, group=specialization_group)
    memberships.append(membership)

    return memberships


def create_or_get_direct_chat(*, current_profile: StudentProfile, target_profile: StudentProfile):
    ordered_ids = sorted((current_profile.id, target_profile.id))
    code = f"direct-{ordered_ids[0]}-{ordered_ids[1]}"
    group, _created = ChatGroup.objects.get_or_create(
        code=code,
        defaults={
            "display_name": "Direct chat",
            "group_type": ChatGroup.GROUP_TYPE_DIRECT,
            "is_read_only": False,
        },
    )
    if group.group_type != ChatGroup.GROUP_TYPE_DIRECT:
        group.group_type = ChatGroup.GROUP_TYPE_DIRECT
        group.is_read_only = False
        group.save(update_fields=("group_type", "is_read_only"))

    ChatMembership.objects.get_or_create(student=current_profile, group=group)
    ChatMembership.objects.get_or_create(student=target_profile, group=group)
    return group
