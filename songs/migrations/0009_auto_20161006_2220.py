# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-10-06 22:20
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('songs', '0008_auto_20160928_0159'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='track',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='track',
            name='song',
        ),
        migrations.DeleteModel(
            name='Track',
        ),
    ]