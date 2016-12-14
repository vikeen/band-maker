# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-12-12 02:21
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('songs', '0007_auto_20161209_1853'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trackrequest',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('declined', 'Declined')], default='pending', max_length=100),
        ),
    ]