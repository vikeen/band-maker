# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-12-28 19:16
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('songs', '0017_auto_20161228_1912'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='stats',
            table='songs_song_stats',
        ),
    ]
