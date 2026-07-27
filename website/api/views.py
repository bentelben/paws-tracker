from django.views import View
from django.http import HttpRequest, JsonResponse, HttpResponseBadRequest
from django.utils.timezone import make_aware, now

from api.models import Location
from api.maps import get_selected_map

import random
from datetime import datetime, time, timedelta, timezone

class DayView(View):
    def get(self, request: HttpRequest, date_str: str):
        try:
            day = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return HttpResponseBadRequest('Wrong date format')

        start = datetime.combine(day, time.min) - timedelta(minutes=15)
        end   = datetime.combine(day, time.max) + timedelta(minutes=15)

        start = make_aware(start)
        end   = make_aware(end)

        locations = Location.objects.filter(
            time__gte = start,
            time__lte = end
        ).order_by('time')

        return get_selected_map().locationsToJsonResponse(locations)

class LiveView(View):
    def get(self, request: HttpRequest, last_time: int):
        last_time += 1

        start = datetime.fromtimestamp(last_time, tz=timezone.utc)
        
        if start < now() - timedelta(days=1):
            start = now() - timedelta(days=1)

        locations = Location.objects.filter(
            time__gt = start
        ).order_by('time')

        return get_selected_map().locationsToJsonResponse(locations)

class StatusView(View):
    def get(self, request: HttpRequest):
        text = "Кошка гуляет по третьему этажу"

        return JsonResponse({"text": text})

class GenerateDotView(View):
    def get(self, request: HttpRequest):
        last_location = Location.objects.order_by('-time').first()

        Location.objects.create(
            x = min(10, max(0, last_location.x + random.uniform(-1, 1))),
            y = min(5, max(0, last_location.y + random.uniform(-1, 1))),
            z = 0,
            time = make_aware(datetime.now())
        )
        return HttpResponseBadRequest()