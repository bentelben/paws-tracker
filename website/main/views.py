from django.shortcuts import render
from django.views import View
from django.http import HttpRequest
from django.conf import settings

from api.maps import get_selected_map

class InfoView(View):
    def get(self, request: HttpRequest):
        return render(
            request,
            'info.html'
        )

class HeatView(View):
    def get(self, request: HttpRequest):
        return render(
            request,
            'heat.html'
        )

class MapView(View):
    def get(self, request: HttpRequest):
        return render(
            request,
            'map.html',
            {
                'map_image_url': get_selected_map().image_url,
                'live_update_interval': settings.LIVE_UPDATE_INTERVAL,
                'map_marker_capacity':  settings.MAP_MARKER_CAPACITY
            }
        )