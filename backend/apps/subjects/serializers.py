from rest_framework import serializers

from .models import Subject, SubjectMaterial


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("slug", "name", "sort_order")


class SubjectMaterialSerializer(serializers.ModelSerializer):
    subject = serializers.CharField(source="subject.slug", read_only=True)
    file_url = serializers.FileField(source="file", read_only=True)

    class Meta:
        model = SubjectMaterial
        fields = (
            "id",
            "subject",
            "title",
            "file_url",
            "file_size",
            "original_filename",
            "uploaded_at",
        )
