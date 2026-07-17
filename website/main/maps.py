from __future__ import annotations

from PIL import Image

from django.http import JsonResponse
from django.contrib.staticfiles import finders

from main.models import Location

class Marker:
    def __init__(self, x: float, y: float, time: int):
        self.x = x       # абс коорд в процентах от размеров картинки карты
        self.y = y
        self.time = time # время в posix формате (кол-во секунд)
    
    def toDict(self) -> dict:
        return {
            'x': self.x,
            'y': self.y,
            'time': self.time
        }

class Floor:
    def __init__(
        self,
        origin_point_x: int,
        origin_point_y: int,
        z_floor: float,
    ):
        self.origin_point_x = origin_point_x
        self.origin_point_y = origin_point_y
        self.z_border = z_floor

class Map:
    def __init__(self, 
        image_url: str,
        ratio:     float,        # масштаб, сколько пикселей в метре
        floors:    list[Floor],
        flip_axes: bool = False, # поменять местами Ox и Oy
        flip_x:    bool = False, # направить Ox в другую сторону
        flip_y:    bool = False, # направить Oy в другую сторону
    ):
        self.image_url = image_url
        self.ratio = ratio
        self.floors = floors
        self.flip_axes = flip_axes
        self.flip_x = flip_x
        self.flip_y = flip_y

        img_path = finders.find(image_url)
        if img_path is None:
            raise FileNotFoundError("Map image file not found")

        with Image.open(img_path) as img:
            self.image_width  = img.size[0]
            self.image_height = img.size[1]
    
    def determineFloor(self, location: Location) -> Floor:
        for i in range(1, len(self.floors)):
            if location.z < self.floors[i].z_border:
                return self.floors[i-1]
        return self.floors[len(self.floors) - 1]

    def locationToMarker(self, location: Location) -> Marker:
        floor = self.determineFloor(location)

        x_offset = location.x * self.ratio
        if self.flip_x:
            x_offset *= -1

        y_offset = location.y * self.ratio
        if self.flip_y:
            y_offset *= -1
        
        if self.flip_axes:
            x_offset, y_offset = y_offset, x_offset

        return Marker(
            100 * (floor.origin_point_x + x_offset) / self.image_width,
            100 * (floor.origin_point_y + y_offset) / self.image_height,
            int(location.time.timestamp())
        )
    
    def locationsToJsonResponse(self, locations) -> JsonResponse:
        return JsonResponse(
            [self.locationToMarker(location).toDict() for location in locations],
            safe = False
        )


TEST_MAP = Map(
    'images/maps/test.png',
    10/1,
    [
        Floor(65, 76, 0)
    ]
)