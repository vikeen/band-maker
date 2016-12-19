from django.contrib import admin

from .models import Song, Track, TrackRequest

admin.site.register(Song)
admin.site.register(Track)
admin.site.register(TrackRequest)