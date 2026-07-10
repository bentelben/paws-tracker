from django.shortcuts import render
from django.views import View
from django.http import HttpRequest, HttpResponse

import json

class MapView(View):
    def get(self, request: HttpRequest):
        map_image_url = 'images/map.png'
        map_image_width = 1920
        map_image_height = 1080
        map_ratio = 145/1 # pixel/meter

        md_location_array = [
            {
                'x': 1,
                'y': 1,
                'time': 0
            },
            {
                'x': 1.5,
                'y': 1,
                'time': 3
            },
            {
                'x': 2,
                'y': 1,
                'time': 7
            },
        ]

        return render(
            request,
            'map.html',
            {
                'map_image_url': map_image_url,
                'map_image_width': map_image_width,
                'map_image_height': map_image_height,
                'map_ratio': map_ratio,
                'md_location_array': json.dumps(md_location_array),
            }
        )