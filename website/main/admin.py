from django.contrib import admin

from .models import ContactSettings

@admin.register(ContactSettings)
class ContactSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'telegram',
        'github'
    )