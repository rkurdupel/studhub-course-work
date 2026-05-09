from django.urls import path

from .views import ChatGroupListView, ChatMessageView, ChatUserListView, DirectChatCreateView


urlpatterns = [
    path("groups/", ChatGroupListView.as_view(), name="chat-group-list"),
    path("users/", ChatUserListView.as_view(), name="chat-user-list"),
    path("direct/", DirectChatCreateView.as_view(), name="chat-direct-create"),
    path("groups/<int:group_id>/messages/", ChatMessageView.as_view(), name="chat-messages"),
]
