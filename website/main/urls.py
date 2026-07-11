from django.urls import path, include

from main.views import MapView, GetDayDataView, GetLiveUpdatesView, GenerateDotView

app_name = 'main'

urlpatterns = [
    path('map/', MapView.as_view(), name='map'),
    path('api/day/<str:date_str>', GetDayDataView.as_view(), name='api_day'),
    path('api/live/<int:last_time>', GetLiveUpdatesView.as_view(), name='api_live'),
    path('generatedot/', GenerateDotView.as_view()),
]