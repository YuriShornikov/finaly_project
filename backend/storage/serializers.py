from rest_framework import serializers
from django.utils.timezone import localtime
from .models import File
from django.contrib.sites.models import Site

class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id')
    upload_date = serializers.SerializerMethodField()
    last_downloaded = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            'id',
            'file_name',
            'url',
            'file_size',
            'upload_date',
            'last_downloaded',
            'updated_at',
            'comment',
            'user_id',
            'type',
        ]

    def get_upload_date(self, obj):
        if obj.upload_date:
            return localtime(obj.upload_date).strftime('%d.%m.%Y %H:%M:%S')
        return None

    # Приведение даты
    def get_last_downloaded(self, obj):
        if obj.last_downloaded:
            return localtime(obj.last_downloaded).strftime('%d.%m.%Y %H:%M:%S')
        return None

    # Приведение размеров файла
    def get_file_size(self, obj):
        size = obj.file_size
        if size < 1024:
            return f"{size} Б"
        elif size < 1024 ** 2:
            return f"{size / 1024:.2f} КБ"
        elif size < 1024 ** 3:
            return f"{size / (1024 ** 2):.2f} МБ"
        else:
            return f"{size / (1024 ** 3):.2f} ГБ"
    
    # Формирование имени
    def get_file_name(self, obj):
        return obj.file_name.rsplit('.', 1)[0]
    
    def get_url(self, obj):
        current_site = Site.objects.get_current()
        return f"http://{current_site.domain}/media/{obj.url}"