from django.db import models

class Location(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    time = models.DateTimeField()