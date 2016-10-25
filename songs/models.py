from django.db import models
from django.contrib.auth.models import User

from tracks.models import Track


class Song(models.Model):
    title = models.CharField(max_length=200)
    likes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    tracks = models.ManyToManyField(Track)
    media_url = models.CharField(max_length=500, null=True, blank=True)
    description = models.TextField(max_length=500, null=True, blank=True)
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class TrackRequest(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    media_url = models.CharField(max_length=500)
    media_name = models.CharField(max_length=500, null=True, blank=True)
    status = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)

    class Meta:
        db_table = 'songs_track_requests'
