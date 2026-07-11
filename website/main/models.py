from django.db import models

class Location(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    time = models.DateTimeField()

    def to_dict(self):
        return {
            'x': self.x,
            'y': self.y,
            'z': self.z,
            'time': int(self.time.timestamp())
        }