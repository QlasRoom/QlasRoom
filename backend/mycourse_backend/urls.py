from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.http import JsonResponse, HttpResponse
from django.core.management import call_command

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'QlasRoom Backend is alive!'})

def run_migrations(request):
    try:
        # Run Django migrations programmatically
        call_command('migrate', interactive=False)
        return HttpResponse("Database Migration Successful!")
    except Exception as e:
        return HttpResponse(f"Migration Failed: {str(e)}", status=500)

urlpatterns = [
    path('health/', health_check),
    path('migrate-db/', run_migrations),
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('classroom.urls')),
]
