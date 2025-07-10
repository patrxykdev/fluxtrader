from django.contrib import admin
from django.urls import path, include 
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import the views from simplejwt
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # This endpoint will be used to get a new access token once it expires
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
         
]

