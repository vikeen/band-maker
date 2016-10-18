from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User


class Track(models.Model):
    instrument = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    media_url = models.CharField(max_length=500)
    media_name = models.CharField(max_length=500, null=True, blank=True)
    likes = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
