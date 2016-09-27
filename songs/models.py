from django.db import models
from django.contrib.auth.models import User


class Song(models.Model):
    title = models.CharField(max_length=200)
    likes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    composer = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    media_url = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.title
