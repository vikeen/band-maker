# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-09-22 02:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('songs', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='song',
            name='views',
            field=models.IntegerField(default=0),
        ),
    ]
