from time import time
from django.conf import settings

def app_settings(request):
    return {
        'STATUS_UPDATE_INTERVAL': settings.STATUS_UPDATE_INTERVAL,
        'version': time() if settings.DEBUG else 0
    }