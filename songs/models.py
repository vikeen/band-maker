from django.db import models
from django.contrib.auth.models import User


class Song(models.Model):
    title = models.CharField(max_length=200)
    likes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    composer = models.ForeignKey(User, on_delete=models.CASCADE)
    media_url = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.title


class Track(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    status = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    media_url = models.CharField(max_length=500, null=True, blank=True)
    likes = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
