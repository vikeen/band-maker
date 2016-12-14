from django.db import models
from django.contrib.auth.models import User


class Skill(models.Model):
    SKILL_CHOICES = (
        (
            'Bass', (
                ('guitar_acoustic_bass', 'Acoustic Bass Guitar'),
                ('guitar_double_bass', 'Double Bass'),
                ('guitar_bass', 'Bass Guitar'),)
        ),
        (
            'Guitar', (
                ('guitar_acoustic', 'Acoustic Guitar'),
                ('guitar_classical', 'Classical Guitar'),
                ('guitar_electric', 'Electric Guitar'),
                ('guitar_steel', 'Steel Guitar'),
            )
        ),
        (
            'Keyboards', (
                ('keyboard_accordion', 'Accordion'),
                ('keyboard_piano', 'Piano'),
                ('keyboard_pipe_organ', 'Pipe Organ'),
                ('keyboard_synthesizer', 'Synthesizer'),
            )
        ),
        (
            'Percussion', (
                ('percussion_bass', 'Bass Drum'),
                ('percussion_bongos', 'Bongos'),
                ('percussion_cymbals', 'Cymbals'),
                ('percussion_snare', 'Snare Drum'),
                ('percussion_drum_set', 'Drum Set'),
            )
        ),
        (
            'Strings', (
                ('string_banjo', 'Banjo'),
                ('string_cello', 'Cello'),
                ('string_harp', 'Harp'),
                ('string_mandolin', 'Mandolin'),
                ('string_ukulele', 'Ukulele'),
                ('string_viola', 'Viola'),
                ('string_violin', 'Violin'),
            )
        ),
        (
            'Winds', (
                ('wind_clarinet', 'Clarinet'),
                ('wind_flute', 'Flute'),
                ('wind_french_horn', 'French Horn'),
                ('wind_saxophone', 'Saxophone'),
                ('wind_trombone', 'Trombone'),
                ('wind_trumpet', 'Trumpet'),
                ('wind_tuba', 'Tuba'),
            )
        ),
        (
            'Vocals', (
                ('vocal_baritone', 'Baritone Vocals'),
                ('vocal_bass', 'Bass Vocals'),
                ('vocal_general', 'General Vocals'),
                ('vocal_soprano', 'Soprano Vocals'),
                ('vocal_tenor', 'Tenor Vocals'),
                ('vocal_alto', 'Alto Vocals'),
            )
        ),
    )

    name = models.CharField(max_length=100, choices=SKILL_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("name", "user"),)
