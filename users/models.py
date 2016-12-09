from django.db import models
from django.contrib.auth.models import User


class Skill(models.Model):
    SKILL_CHOICES = (
        ('rhythm_guitar', 'Rhythm Guitar'),
        ('lead_guitar', 'Lead Guitar'),
        ('bass_guitar', 'Bass Guitar')
    )

    name = models.CharField(max_length=100, choices=SKILL_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("name", "user"),)
