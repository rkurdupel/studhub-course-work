from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CurrentUserView, EmailTokenObtainPairView, RegistrationView


urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("register/", RegistrationView.as_view(), name="register"),
    path("token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
