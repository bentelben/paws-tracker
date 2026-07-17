from time import time

def app_settings(request):
    return {
        'STATUS_UPDATE_INTERVAL': 10,
        'version': time()
    }