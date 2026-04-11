from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, CategoryViewSet, CourseViewSet, 
    VideoProgressViewSet, ProfileView, GoogleLoginView, 
    VerifyEmailView, DailyCheckInViewSet, GoalViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'progress', VideoProgressViewSet, basename='progress')
router.register(r'daily-checkins', DailyCheckInViewSet, basename='daily-checkin')
router.register(r'goals', GoalViewSet, basename='goal')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
]
