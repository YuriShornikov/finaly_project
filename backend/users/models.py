from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.timezone import now

class CustomUserManager(BaseUserManager):
    def create_user(self, login, fullname, email=None, password=None, **extra_fields):
        if not login:
            raise ValueError("The Login field must be set")
        if not fullname:
            raise ValueError("The Fullname field must be set")
        
        extra_fields.setdefault('is_admin', False)
        user = self.model(login=login, fullname=fullname, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, fullname, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_admin') is not True:
            raise ValueError('Superuser must have is_admin=True.')
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(login, fullname, email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    login = models.CharField(max_length=150, unique=True)
    fullname = models.CharField(max_length=150)
    email = models.EmailField(unique=True, blank=True, null=True)
    password = models.CharField(max_length=128)
    avatar = models.URLField(max_length=200, blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=now)
    others = models.JSONField(default=dict, blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['fullname']

    def __str__(self):
        return self.login
