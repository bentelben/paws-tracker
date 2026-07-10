from django.urls import path, include

from main.views import MapView

app_name = 'main'

urlpatterns = [
    path('map/', MapView.as_view(), name='map')
]