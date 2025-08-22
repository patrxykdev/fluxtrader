from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, ProfileView, StrategyViewSet, BacktestView, DateRangeView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'strategies', StrategyViewSet, basename='strategy')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # This line includes all the generated URLs (e.g., /api/strategies/)
    path('', include(router.urls)),
    
    # Keep your existing custom paths
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('backtest/', BacktestView.as_view(), name='backtest'),
    path('date-range/', DateRangeView.as_view(), name='date-range'),
]