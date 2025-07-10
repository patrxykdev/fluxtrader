# api/urls.py
from django.urls import path
from .views import RegisterView, ProfileView # Add ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'), # Add this line
]