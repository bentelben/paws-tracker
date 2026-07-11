from django.shortcuts import render
from django.views import View
from django.http import HttpRequest, HttpResponse, JsonResponse, HttpResponseBadRequest
from django.utils.timezone import make_aware, now

from main.models import Location

import random
from datetime import datetime, time, timedelta, timezone

class MapView(View):
    def get(self, request: HttpRequest):
        map_image_url = 'images/map.png'
        map_image_width = 1920
        map_image_height = 1080
        map_ratio = 145/1 # pixel/meter
        live_update_interval = 10 # seconds
        history_period = 600 # seconds

        return render(
            request,
            'map.html',
            {
                'map_image_url': map_image_url,
                'map_image_width': map_image_width,
                'map_image_height': map_image_height,
                'map_ratio': map_ratio,
                'live_update_interval': live_update_interval,
                'history_period': history_period
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

        return JsonResponse(
            [loc.to_dict() for loc in locations],
            safe = False
        )

class GetLiveUpdatesView(View):
    def get(self, request: HttpRequest, last_time: int):
        last_time += 1

        start = datetime.fromtimestamp(last_time, tz=timezone.utc)
        
        if start < now() - timedelta(days=1):
            start = now() - timedelta(days=1)

        locations = Location.objects.filter(
            time__gt = start
        ).order_by('time')

        return JsonResponse(
            [loc.to_dict() for loc in locations],
            safe = False
        )

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