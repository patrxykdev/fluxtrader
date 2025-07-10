# api/views.py
from rest_framework import generics, status
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated # Add IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView # Import APIView


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            "user": serializer.data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

# api/views.py (add this new class)

class ProfileView(APIView):
    permission_classes = (IsAuthenticated,) # This is the key part!

    def get(self, request):
        # The user is available via request.user thanks to JWTAuthentication
        serializer = UserSerializer(request.user)
        return Response(serializer.data)