import uuid

from django.db import models
from django.contrib.auth.models import User


class Track(models.Model):
    instrument = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    audio_url = models.CharField(max_length=500, null=True, blank=True)
    audio_name = models.CharField(max_length=500, null=True, blank=True)
    audio_size = models.IntegerField(null=True, blank=True)
    audio_content_type = models.CharField(max_length=100, null=True, blank=True)
    public = models.BooleanField(default=False)
    likes = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    uuid = models.UUIDField(default=uuid.uuid4)


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
    uuid = models.UUIDField(default=uuid.uuid4)

    def __str__(self):
        return self.title


class TrackRequest(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    audio_url = models.CharField(max_length=500)
    audio_name = models.CharField(max_length=500, null=True, blank=True)
    status = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)

    class Meta:
        db_table = 'songs_track_requests'
