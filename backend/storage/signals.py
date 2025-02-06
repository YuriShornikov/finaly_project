from django.db.models.signals import post_migrate
from django.contrib.sites.models import Site
from django.conf import settings
import environ

env = environ.Env()

def create_default_site(sender, **kwargs):
    if settings.DEBUG:
        Site.objects.update_or_create(
            id=1,
            defaults={
                "domain": env("DOMAIN", default="localhost"),
                "name": env("SITE_NAME", default="localhost"),
            },
        )

post_migrate.connect(create_default_site)
