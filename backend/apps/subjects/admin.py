from django.contrib import admin

from .models import Subject, SubjectMaterial


class SubjectMaterialInline(admin.TabularInline):
    model = SubjectMaterial
    extra = 1
    fields = ("title", "file", "uploaded_at")
    readonly_fields = ("uploaded_at",)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order")
    search_fields = ("name", "slug")
    ordering = ("sort_order", "name")
    inlines = (SubjectMaterialInline,)


@admin.register(SubjectMaterial)
class SubjectMaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "uploaded_at")
    search_fields = ("title", "subject__name", "subject__slug")
    list_filter = ("subject",)
    exclude = ("file_size", "original_filename")
