from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.contrib.auth import get_user_model

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        post_migrate.connect(create_superuser, sender=self)

def create_superuser(sender, **kwargs):
    """
    Создает суперпользователя после выполнения миграций.
    """
    User = get_user_model()
    if not User.objects.filter(login="admin").exists():
        User.objects.create_superuser(
            login="admin",
            fullname="admin",
            email="admin@gmail.com",
            password="1234Q!"
        )
        print("Суперпользователь admin создан успешно!")
    else:
        print("Суперпользователь уже существует.")
