from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Subject, SubjectMaterial
from .serializers import SubjectMaterialSerializer, SubjectSerializer


class SubjectListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()


class SubjectMaterialListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectMaterialSerializer

    def get_queryset(self):
        subject = get_object_or_404(Subject, slug=self.kwargs["slug"])
        return subject.materials.all()


class SubjectMaterialDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request, pk):
        material = get_object_or_404(SubjectMaterial, pk=pk)
        return FileResponse(
            material.file.open("rb"),
            as_attachment=True,
            filename=material.original_filename or material.file.name.split("/")[-1],
        )
