# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-10-25 01:08
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tracks', '0003_track_media_name'),
        ('songs', '0015_song_published'),
    ]

    operations = [
        migrations.CreateModel(
            name='TrackRequest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('media_url', models.CharField(max_length=500)),
                ('media_name', models.CharField(blank=True, max_length=500, null=True)),
                ('status', models.IntegerField(default=0)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('track', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tracks.Track')),
            ],
        ),
    ]
