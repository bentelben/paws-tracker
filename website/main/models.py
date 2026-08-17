from django.db import models

class ContactSettings(models.Model):
    telegram = models.CharField()
    github = models.CharField()