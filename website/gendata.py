import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.utils.timezone import make_aware
from main.models import Location

from datetime import datetime, timedelta
import random

Location.objects.all().delete()

interval_seconds = 6

current_x = 5.0
current_y = 4.0
current_z = 0.0

width = 10
height = 5

total_seconds_in_day = 24 * 60 * 60
total_points = total_seconds_in_day // interval_seconds

def genday(start_naive):
    global current_x, current_y, current_z
    locations_list = []
    
    for i in range(total_points):
        max_step = 0.1 * interval_seconds
        
        current_x += random.uniform(-max_step, max_step)
        current_y += random.uniform(-max_step, max_step)
        
        current_x = max(0.0, min(current_x, width))
        current_y = max(0.0, min(current_y, height))

        #if random.random() < 0.10:
        #    current_z = random.choice([0.0, 0.4, 0.8])

        point_time_naive = start_naive + timedelta(seconds=i * interval_seconds)
        point_time_aware = make_aware(point_time_naive)

        loc = Location(
            x=round(current_x, 2),
            y=round(current_y, 2),
            z=round(current_z, 2),
            time=point_time_aware
        )
        locations_list.append(loc)

    Location.objects.bulk_create(locations_list)


for i in range(-2, 2):
    start_naive = datetime.now() + timedelta(days=i)
    genday(start_naive)