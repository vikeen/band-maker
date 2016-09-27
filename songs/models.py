from django.db import models
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User


class Song(models.Model):
    title = models.CharField(max_length=200)
    likes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    composer = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('songs:update', kwargs={'pk': self.pk})