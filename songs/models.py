import uuid

from django.db import models
from django.contrib.auth.models import User

from users.models import Skill
from .licenses import license


class Song(models.Model):
    title = models.CharField(max_length=200)
    likes = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    media_url = models.CharField(max_length=500, null=True, blank=True)
    description = models.TextField(max_length=500, null=True, blank=True)
    published = models.BooleanField(default=False)
    license = models.CharField(choices=(("cc-by-4.0", "Creative Commons Attribution 4.0"),), default="cc-by-4.0",
                               max_length=100)
    uuid = models.UUIDField(default=uuid.uuid4)

    def __str__(self):
        return self.title

    def get_license_information(self):
        return license[self.license]


class Track(models.Model):
    TRACK_INSTRUMENT_CHOICES = Skill.SKILL_CHOICES

    instrument = models.CharField(max_length=100, choices=TRACK_INSTRUMENT_CHOICES)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    contributed_by = models.ForeignKey(User, null=True, blank=True, related_name='contributed_by')
    audio_url = models.CharField(max_length=500, null=True, blank=True)
    audio_name = models.CharField(max_length=500, null=True, blank=True)
    audio_size = models.IntegerField(null=True, blank=True)
    audio_content_type = models.CharField(max_length=100, null=True, blank=True)
    public = models.BooleanField(default=False)
    likes = models.IntegerField(default=0)
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    license = models.CharField(choices=(("cc-by-4.0", "Creative Commons Attribution 4.0"),), default="cc-by-4.0",
                               max_length=100)
    uuid = models.UUIDField(default=uuid.uuid4)

    def __str__(self):
        return self.instrument

    def get_license_information(self):
        return license[self.license]


class TrackRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined')
    )

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    audio_url = models.CharField(max_length=500)
    audio_name = models.CharField(max_length=500, null=True, blank=True)
    audio_size = models.IntegerField(null=True, blank=True)
    audio_content_type = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(default='pending', max_length=100, choices=STATUS_CHOICES)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    license = models.CharField(choices=(("cc-by-4.0", "Creative Commons Attribution 4.0"),), default="cc-by-4.0",
                               max_length=100)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)

    def __str__(self):
        return self.audio_name

    class Meta:
        db_table = 'songs_track_requests'
