import mimetypes

from PIL import Image, UnidentifiedImageError
from rest_framework import serializers

from apps.accounts.models import StudentProfile
from .models import ChatGroup, ChatMessage

MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
    image = serializers.ImageField(required=False, allow_null=True)
    attachment = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = ChatMessage
        fields = ("id", "text", "image", "attachment")
        read_only_fields = ("id",)

    def validate_attachment(self, attachment):
        if attachment.size > MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError("Файл занадто великий.")
        return attachment

    def validate_image(self, image):
        if image.size > MAX_ATTACHMENT_SIZE:
            raise serializers.ValidationError("Зображення занадто велике.")
        if image.size < 1024:
            raise serializers.ValidationError("Зображення занадто маленьке.")

        try:
            image.seek(0)
            with Image.open(image) as uploaded_image:
                uploaded_image.verify()
            image.seek(0)
            with Image.open(image) as uploaded_image:
                width, height = uploaded_image.size
        except (UnidentifiedImageError, OSError, ValueError):
            raise serializers.ValidationError("Завантажте коректне зображення.")

        if width < 16 or height < 16:
            raise serializers.ValidationError("Зображення занадто маленьке.")

        image.seek(0)
        return image

    def validate(self, attrs):
        text = attrs.get("text", "").strip()
        image = attrs.get("image")
        attachment = attrs.get("attachment")
        if not text and image is None and attachment is None:
            raise serializers.ValidationError("Напишіть текст або додайте файл.")
        return attrs


class ChatGroupSerializer(serializers.ModelSerializer):
    participant_id = serializers.SerializerMethodField()
    participant_email = serializers.SerializerMethodField()
    participant_name = serializers.SerializerMethodField()
    participant_course = serializers.SerializerMethodField()
    participant_specialization = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatGroup
        fields = (
            "id",
            "code",
            "display_name",
            "group_type",
            "is_read_only",
            "participant_id",
            "participant_email",
            "participant_name",
            "participant_course",
            "participant_specialization",
        )

    def _get_other_participant(self, obj) -> StudentProfile | None:
        request = self.context.get("request")
        if obj.group_type != ChatGroup.GROUP_TYPE_DIRECT or request is None:
            return None
        current_profile_id = request.user.student_profile.pk
        memberships = getattr(obj, "_prefetched_objects_cache", {}).get("memberships")
        if memberships is not None:
            for membership in memberships:
                if membership.student_id != current_profile_id:
                    return membership.student
            return None
        return (
            StudentProfile.objects.filter(chat_memberships__group=obj)
            .exclude(pk=current_profile_id)
            .select_related("user")
            .first()
        )

    def get_display_name(self, obj):
        other = self._get_other_participant(obj)
        if other is None:
            return obj.display_name
        return other.full_name or other.user.email.split("@")[0]

    def get_participant_id(self, obj):
        other = self._get_other_participant(obj)
        return other.id if other is not None else None

    def get_participant_email(self, obj):
        other = self._get_other_participant(obj)
        return other.user.email if other is not None else None

    def get_participant_name(self, obj):
        other = self._get_other_participant(obj)
        if other is None:
            return None
        return other.full_name or other.user.email.split("@")[0]

    def get_participant_course(self, obj):
        other = self._get_other_participant(obj)
        return other.course if other is not None else None

    def get_participant_specialization(self, obj):
        other = self._get_other_participant(obj)
        return other.specialization if other is not None else None


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source="sender.email", read_only=True, allow_null=True)
    sender_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    attachment_is_image = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "text",
            "sender_email",
            "sender_name",
            "image_url",
            "attachment_url",
            "attachment_name",
            "attachment_is_image",
            "is_system",
            "created_at",
        )

    def get_sender_name(self, obj):
        if obj.sender is None:
            return None
        if hasattr(obj.sender, "student_profile") and obj.sender.student_profile.full_name:
            return obj.sender.student_profile.full_name
        return obj.sender.email.split("@")[0]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.attachment.url) if request else obj.attachment.url

    def get_attachment_name(self, obj):
        if not obj.attachment:
            return None
        return obj.attachment.name.split("/")[-1]

    def get_attachment_is_image(self, obj):
        if not obj.attachment:
            return False
        mime_type, _encoding = mimetypes.guess_type(obj.attachment.name)
        return bool(mime_type and mime_type.startswith("image/"))


class ChatUserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ("id", "email", "name", "full_name", "course", "specialization")

    def get_name(self, obj):
        return obj.full_name or obj.user.email.split("@")[0]


class DirectChatCreateSerializer(serializers.Serializer):
    participant_id = serializers.IntegerField(min_value=1)
