# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-12-09 20:30
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_auto_20161209_1919'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='skill',
            unique_together=set([('name', 'user')]),
        ),
    ]
