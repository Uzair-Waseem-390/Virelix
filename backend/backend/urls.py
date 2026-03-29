from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from dashboard.auth import VorelixLoginView

@api_view(['GET'])
@permission_classes([AllowAny])
def root(request):
    return Response({"message": "Hello Uzair"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', root, name='root'),
    path('auth/login/',   VorelixLoginView.as_view(),  name='token_obtain'),
    path('auth/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
    path('accounts/', include('accounts.urls', namespace='accounts')),
    path('projects/', include('projects.urls', namespace='projects')),
    path('dashboard/', include('dashboard.urls', namespace='dashboard')),
]
