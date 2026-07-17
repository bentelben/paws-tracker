from django.shortcuts import render
from django.views import View
from django.http import HttpRequest, HttpResponse, JsonResponse, HttpResponseBadRequest
from django.utils.timezone import make_aware, now

from main.models import Location
from main.maps import TEST_MAP

import random
from datetime import datetime, time, timedelta, timezone
import time as t

SELECTED_MAP = TEST_MAP
LIVE_UPDATE_INTERVAL = 10  # seconds
MAP_MARKER_CAPACITY  = 20

class MapView(View):
    def get(self, request: HttpRequest):
        return render(
            request,
            'map.html',
            {
                'map_image_url': SELECTED_MAP.image_url,
                'live_update_interval': LIVE_UPDATE_INTERVAL,
                'map_marker_capacity': MAP_MARKER_CAPACITY,
                'version': t.time(),
            }
        )

class GetDayDataView(View):
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

        return SELECTED_MAP.locationsToJsonResponse(locations)

class GetLiveUpdatesView(View):
    def get(self, request: HttpRequest, last_time: int):
        last_time += 1

        start = datetime.fromtimestamp(last_time, tz=timezone.utc)
        
        if start < now() - timedelta(days=1):
            start = now() - timedelta(days=1)

        locations = Location.objects.filter(
            time__gt = start
        ).order_by('time')

        return SELECTED_MAP.locationsToJsonResponse(locations)

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