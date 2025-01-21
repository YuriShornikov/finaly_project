from django.db import models
from users.models import CustomUser
import os

def user_directory_path(instance, filename):
    return f'user_files/{instance.user.id}/{filename}'

class File(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="files")
    file_name = models.CharField(max_length=255)
    url = models.FileField(upload_to=user_directory_path)
    file_size = models.IntegerField()
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_downloaded = models.DateTimeField(null=True, blank=True)
    comment = models.TextField(blank=True)
    type = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.url:
            if not self.file_size:
                self.file_size = self.url.size
            if not self.file_name:
                self.file_name = os.path.basename(self.url.name)
            if not self.type:
                self.type = self.url.file.content_type
        
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.url:
            self.url.delete(False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.file_name

    @property
    def file_url(self):
        return self.url.url
