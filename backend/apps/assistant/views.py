from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_assistant_response


class AssistantChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = str(request.data.get("message", "")).strip()
        response_text = build_assistant_response(request.user.student_profile, message)
        return Response({"response": response_text})

