from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from users.views import RegisterView, LoginView, LogoutView, UpdateUserView, DeleteUserView, GetUsersView
from storage.views import FileUploadView

# Регистрация ViewSet для работы с файлами
router = DefaultRouter()
router.register(r'files', FileUploadView, basename='file')

urlpatterns = [
    # Используем маршруты для APIView (RegisterView, LoginView, LogoutView)
    path('api/users/register/', RegisterView.as_view(), name='register'),
    path('api/users/login/', LoginView.as_view(), name='login'),
    path('api/users/logout/', LogoutView.as_view(), name='logout'),
    path('api/users/update/', UpdateUserView.as_view(), name='update-user'),
    path('api/users/<int:user_id>/', DeleteUserView.as_view(), name='delete-user'),
    path('api/users/', GetUsersView.as_view(), name='get-users'),
    
    path('api/files/<int:user_id>/upload/', FileUploadView.as_view({'post': 'upload_file'}), name='file-upload'),
    path('api/files/<int:user_id>/', FileUploadView.as_view({'get': 'get_list'}), name='file-list'),
    path('api/files/<int:file_id>/download/', FileUploadView.as_view({'get': 'download_file'}), name='download-file'),
    path('api/files/<int:user_id>/delete/<int:file_id>/', FileUploadView.as_view({'delete': 'delete_file'}), name='delete-file'),
    path('api/files/<int:file_id>/update/', FileUploadView.as_view({'patch': 'update_file'}), name='update_file'),
    
    # Маршруты ViewSet через DefaultRouter
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

