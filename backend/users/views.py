from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

# Токен
def get_tokens_for_user(user):
    try:
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    except Exception as e:
        logger.error(f"Error generating tokens for user {user}: {e}")
        raise

# Регистрация пользователя
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            login(request, user)
            logger.info(f"User registered: {user.login}")
            return Response({
                "message": "Registration successful",
                "tokens": tokens,
                "user": UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)

        logger.warning(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Логин
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        login_data = request.data.get('login')
        password = request.data.get('password')

        if not login_data or not password:
            return Response({"message": "Login and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Login attempt for: {login_data}")
        user = authenticate(request, username=login_data, password=password)

        if user and user.is_active:
            login(request, user)
            logger.info(f"User logged in: {user.login}")

            tokens = get_tokens_for_user(user)

            return Response({
                "message": "Login successful",
                "user": UserSerializer(user).data,
                "tokens": tokens,
            }, status=status.HTTP_200_OK)

        logger.warning(f"Authentication failed for: {login_data}")
        return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Обновление полей
class UpdateUserView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):

        # Проверяем, кто запрашивает изменение
        user = request.user
        data = request.data

        target_user_id = data.get('id', None)
        target_user = user

        # Если администратор, позволяем указать другого пользователя
        if user.is_admin and target_user_id:
            try:
                target_user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response({"error": "Target user does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Разрешённые поля для обновления
        allowed_fields = {"fullname", "login", "email", "password", "avatar", "is_admin"}
        updated_fields = {key: value for key, value in data.items() if key in allowed_fields}

        if not updated_fields:
            return Response({"error": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)

        for field, value in updated_fields.items():
            setattr(target_user, field, value)

        target_user.save()
        serializer = UserSerializer(target_user)
        return Response({"user": serializer.data}, status=status.HTTP_200_OK)


# Выход пользователя
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logout(request)
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

        # Проверяем, что запрос делает администратор
        if not request.user.is_admin:
            return Response({"error": "Нет прав для просмотра пользователей"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            users = User.objects.all()
            serializer = UserSerializer(users, many=True)
            return Response({"users": serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка при получении пользователей: {e}")
            return Response({"error": "Не удалось получить список пользователей"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

