from django.db.models.signals import post_migrate
from django.contrib.sites.models import Site
from django.conf import settings

def create_default_site(sender, **kwargs):
    if settings.DEBUG:
        Site.objects.update_or_create(
            id=1,
            defaults={
                "domain": "localhost:8000",
                "name": "Localhost",
            },
        )

post_migrate.connect(create_default_site)
