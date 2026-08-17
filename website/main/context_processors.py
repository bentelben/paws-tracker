from time import time
from django.conf import settings

from .models import ContactSettings

def app_settings(request):
    contacts = ContactSettings.objects.first()
    return {
        'STATUS_UPDATE_INTERVAL': settings.STATUS_UPDATE_INTERVAL,
        'version': time() if settings.DEBUG else 0,
        'contacts': contacts
    }