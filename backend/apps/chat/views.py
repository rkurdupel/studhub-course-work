from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.accounts.models import StudentProfile
from .models import ChatGroup, ChatMembership, ChatMessage
from .serializers import (
    ChatGroupSerializer,
    ChatMessageCreateSerializer,
    ChatMessageSerializer,
    ChatUserSerializer,
    DirectChatCreateSerializer,
)
from .services import create_or_get_direct_chat


class MembershipRequiredMixin:
    permission_classes = [IsAuthenticated]

    def get_group(self, user, group_id):
        group = get_object_or_404(ChatGroup, pk=group_id)
        has_membership = ChatMembership.objects.filter(
            group=group,
            student=user.student_profile,
        ).exists()
        if not has_membership:
            return None
        return group


class ChatGroupListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatGroupSerializer

    def get_queryset(self):
        return (
            ChatGroup.objects.filter(
                memberships__student=self.request.user.student_profile
            )
            .filter(
                Q(group_type=ChatGroup.GROUP_TYPE_REMINDERS)
                | Q(code="general")
                | Q(code__startswith="specialization-")
            )
            .prefetch_related("memberships__student__user")
            .distinct()
        )


class ChatUserListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatUserSerializer

    def get_queryset(self):
        return (
            StudentProfile.objects.select_related("user")
            .exclude(pk=self.request.user.student_profile.pk)
            .order_by("full_name", "user__email")
        )


class DirectChatCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DirectChatCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_profile = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            pk=serializer.validated_data["participant_id"],
        )
        if target_profile.pk == request.user.student_profile.pk:
            return Response({"participant_id": ["Cannot create chat with yourself."]}, status=status.HTTP_400_BAD_REQUEST)

        group = create_or_get_direct_chat(
            current_profile=request.user.student_profile,
            target_profile=target_profile,
        )
        return Response(ChatGroupSerializer(group, context={"request": request}).data, status=status.HTTP_200_OK)


class ChatMessageView(MembershipRequiredMixin, APIView):
    def get(self, request, group_id):
        group = self.get_group(request.user, group_id)
        if group is None:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ChatMessageSerializer(
            group.messages.select_related("sender").all(),
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request, group_id):
        group = self.get_group(request.user, group_id)
        if group is None:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if group.is_read_only:
            return Response({"detail": "Read-only group"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChatMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = ChatMessage.objects.create(
            group=group,
            sender=request.user,
            text=serializer.validated_data.get("text", ""),
            image=serializer.validated_data.get("image"),
        )
        return Response(
            ChatMessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )
