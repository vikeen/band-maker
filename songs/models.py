from django.db import models

class Song(models.Model):
    title = models.CharField(max_length=200)
    likes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)