from django.urls import path, include

from main.views import InfoView, HeatView, MapView

app_name = 'main'

urlpatterns = [
    path('', InfoView.as_view(), name='info'),
    path('heat/', HeatView.as_view(), name='heat'),
    path('map/', MapView.as_view(), name='map'),
]