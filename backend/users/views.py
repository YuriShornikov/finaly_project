from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse
import logging
import json
from django.contrib.auth import update_session_auth_hash
# from users.models import CustomUser as User

logger = logging.getLogger('users')

User = get_user_model()

def get_csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})

# Регистрация пользователя
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)  # ВАЖНО: создаем сессию
            logger.info(f"User registered: {user.login}")
            return Response({
                "message": "Registration successful",
                "user": UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)

        logger.warning(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Логин через сессию
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        login_data = request.data.get("login")
        password = request.data.get("password")
        logger.info(f"test: {password}")

        if not login_data or not password:
            return Response({"message": "Login and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Login attempt for: {login_data}")
        user = authenticate(request, login=login_data, password=password)
        logger.info(f"test: {user}")

        if request.session.get('_auth_user_id'):
            logout(request)

        if user and user.is_active:
            login(request, user)
            response = Response(
                {
                    "message": "Login successful",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
            response.set_cookie(
                key="csrftoken",
                value=get_token(request),
                httponly=True,
                secure=False,
                samesite="None",
            )
            return response
        
        logout(request)

        logger.info(f"Authentication failed for: {login_data}")
        return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Проверка сессии (получение текущего пользователя)
class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Authenticated", "user": UserSerializer(request.user).data}, status=status.HTTP_200_OK)

# Обновление полей пользователя
class UpdateUserView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        data = request.data

        logger.info(f"Received cookies: {json.dumps(request.COOKIES)}")

        logger.info(f"User {user.fullname} attempting to update user data.")

        # Логируем, кто является текущим пользователем
        logger.info(f"Current user: {user.fullname}, is admin: {user.is_admin}")

        target_user_id = data.get('id', None)
        target_user = user

        # Если пользователь администратор, он может обновить данные другого пользователя
        logger.error(f"не админ: {user.is_admin}")
        if user.is_admin and target_user_id:
            try:
                target_user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response({"error": "Target user does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Разрешенные поля для обновления
        allowed_fields = {"fullname", "login", "email", "password", "avatar", "is_admin"}

        # Фильтруем только те поля, которые разрешены
        updated_fields = {key: value for key, value in data.items() if key in allowed_fields}

        # Если нет действительных полей для обновления
        if not updated_fields:
            return Response({"error": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Before update: user {target_user.fullname}, session_key: {request.session.session_key}")
        # Обновляем поля
        for field, value in updated_fields.items():
            # Если обновляется пароль, можно добавить дополнительную проверку
            if 'password' in updated_fields:
                logger.info(f"Received raw password for user {target_user.fullname}: {value}")
                target_user.set_password(updated_fields['password'])  # Хэшируем пароль
                logger.info(f"Hashed password for user {target_user.fullname}: {target_user.password}")
                update_session_auth_hash(request, target_user)
            else:
                setattr(target_user, field, value)

        

        

        target_user.save()

        logger.info(f"Before update: user {target_user.fullname}, session_key: {request.session.session_key}")
        serializer = UserSerializer(target_user)
        return Response({"user": serializer.data}, status=status.HTTP_200_OK)


# Выход из системы (удаление сессии)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.session.flush()  # Удаление сессии
            logger.info("User logged out.")
            return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Logout failed: {e}")
            return Response({"message": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Удаление пользователя
class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if not request.user.is_admin:
            return Response({"error": "Нет прав для удаления пользователя"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            target_user = User.objects.get(id=user_id)
            target_user.delete()
            return Response({"message": "Пользователь удалён"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)

# Получение списка пользователей
class GetUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Нет прав для просмотра пользователей"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            users = User.objects.all()
            serializer = UserSerializer(users, many=True)
            return Response({"users": serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка при получении пользователей: {e}")
            return Response({"error": "Не удалось получить список пользователей"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
