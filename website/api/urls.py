from django.urls import path, include

from api.views import (
    DayView, LiveView, StatusView, 
    GenerateDotView
)

app_name = 'api'

urlpatterns = [
    path('day/<str:date_str>', DayView.as_view(), name='day'),
    path('live/<int:last_time>', LiveView.as_view(), name='live'),
    path('status', StatusView.as_view(), name='status'),
    path('rand/', GenerateDotView.as_view()),
]