from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import File
from .serializers import FileSerializer
import logging
from django.http import FileResponse
import os
from rest_framework.decorators import action
from rest_framework import viewsets
from django.http import Http404
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import CustomUser
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.conf import settings

logger = logging.getLogger('storage')
logger.setLevel(logging.DEBUG)

User = get_user_model()


class FileUploadView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # Загрузка файлов
    @action(detail=False, methods=['post'])
    def upload_file(self, request, *args, **kwargs):
        files = request.FILES.getlist('file')
        comment = request.data.get('comment', '')
        user_id = request.data.get('user_id')  # Получаем ID целевого пользователя

        if not files:
            return Response({"error": "Файлы не предоставлены"}, status=status.HTTP_400_BAD_REQUEST)

        # Определяем, кому загружать файлы
        target_user = request.user

        # Если админ загружает другому пользователю
        if user_id and request.user.is_admin:
            try:
                target_user = User.objects.get(id=user_id)
            except ObjectDoesNotExist:
                return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)

        max_file_size = 10 * 1024 * 1024  # 10 MB
        uploaded_files = []
        errors = []

        for file in files:
            if file.size > max_file_size:
                errors.append(f"Файл {file.name} превышает допустимый лимит (10 МБ)")
                continue

            try:
                file_instance = File.objects.create(
                    user=target_user,
                    file_name=file.name,
                    file_size=file.size,
                    type=file.content_type,
                    url=file,
                    comment=comment
                )
                uploaded_files.append(FileSerializer(file_instance).data)
            except ValidationError as e:
                errors.append(f"Ошибка при загрузке файла {file.name}: {str(e)}")
                continue

        response_data = {"uploaded_files": uploaded_files}
        if errors:
            response_data["errors"] = errors

        # Возвращаем статус
        status_code = status.HTTP_207_MULTI_STATUS if errors else status.HTTP_201_CREATED
        return Response(response_data, status=status_code)
    
    # Метод для скачивания файла
    @action(detail=True, methods=['get'])
    def download_file(self, request, file_id=None, *args, **kwargs):
        logger.info(f"Заголовки: {request.headers}")
        logger.info(f"Пользователь: {request.user}")

        logger.info(f"Пользователь: {request.user}, Аутентифицирован: {request.user.is_authenticated}")
        if request.user.is_admin:
            file_instance = get_object_or_404(File, id=file_id)
        else:
            file_instance = get_object_or_404(File, id=file_id, user=request.user)
        
        # Путь к файлу
        file_path = file_instance.url.path
        print(file_path)
        if not os.path.exists(file_path):
            raise Http404("Файл не найден.")
        
        # Обновляем поле last_downloaded
        file_instance.last_downloaded = timezone.now()
        file_instance.save()
        
        # Возвращаем файл для скачивания
        response = FileResponse(open(file_path, 'rb'))
        return response


    # Получение списка файлов
    @action(detail=False, methods=['get'])
    def get_list(self, request, user_id=None, *args, **kwargs):
        if not user_id:
            return Response({"error": "Параметр user_id обязателен."}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем, что пользователь запрашивает свои файлы или является администратором
        if request.user.is_admin:

            # Для администратора: возвращаем все файлы
            files = File.objects.all()
        elif request.user.id == int(user_id):

            # Для обычного пользователя: возвращаем только его файлы
            files = File.objects.filter(user_id=user_id)
        else:

            # Если пользователь не админ и не запрашивает свои файлы
            return Response({"error": "Нет прав для просмотра файлов пользователя."}, status=status.HTTP_403_FORBIDDEN)

        serializer = FileSerializer(files, many=True)
        logger.debug("Serialized data: %s", serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Удаление файла
    @action(detail=True, methods=['delete'])
    def delete_file(self, request, user_id=None, file_id=None, *args, **kwargs):

        # Проверяем, что файл принадлежит пользователю или администратору
        if request.user.id == user_id or request.user.is_admin:

            # Админ может удалить любой файл, а обычный пользователь только свои
            file_instance = get_object_or_404(File, id=file_id, user_id=user_id)
        else:
            return Response({"error": "Нет прав для удаления файла."}, status=status.HTTP_403_FORBIDDEN)
        
         # Проверяем, является ли файл аватаром
        user = get_object_or_404(CustomUser, id=user_id)
        if user.avatar == file_instance.url:
            user.avatar = None
            user.save()
        
        # Удаление файла
        file_instance.delete()
        return Response({"message": "Файл успешно удален"}, status=status.HTTP_204_NO_CONTENT)

    # Обновление имени файла или комментария
    @action(detail=True, methods=['patch'])
    def update_file(self, request, file_id=None, *args, **kwargs):
        if request.user.is_admin:
            file_instance = get_object_or_404(File, id=file_id)
        else:
            file_instance = get_object_or_404(File, id=file_id, user=request.user)

        new_name = request.data.get("new_name")
        new_comment = request.data.get("comment")

        # Проверка: новое имя не может быть пустым
        if new_name == "":
            return Response({"error": "Новое имя файла не может быть пустым"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Путь к старому файлу
        old_file_path = file_instance.url.path  # путь до файла в файловой системе

        if new_name and os.path.exists(old_file_path):
            file_extension = os.path.splitext(old_file_path)[1]  # получаем расширение файла
            new_file_name = f"{new_name}{file_extension}"  # сохраняем расширение
            new_file_path = os.path.join(os.path.dirname(old_file_path), new_file_name)

            os.rename(old_file_path, new_file_path)  # переименовываем файл
            file_instance.url.name = os.path.relpath(new_file_path, settings.MEDIA_ROOT)  # обновляем путь в базе

            if new_name:
                file_instance.file_name = new_name
            
        if new_comment is not None:
            file_instance.comment = new_comment

        file_instance.save()

        serializer = FileSerializer(file_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
