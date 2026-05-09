from django.urls import path

from .views import SubjectListView, SubjectMaterialDownloadView, SubjectMaterialListView


urlpatterns = [
    path("", SubjectListView.as_view(), name="subject-list"),
    path("<slug:slug>/materials/", SubjectMaterialListView.as_view(), name="subject-material-list"),
    path("materials/<int:pk>/download/", SubjectMaterialDownloadView.as_view(), name="subject-material-download"),
]
