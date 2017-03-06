# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2017-01-31 19:49
from __future__ import unicode_literals

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('round', '0017_slidervalue_round_order'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='slidervalue',
            name='date',
        ),
        migrations.AddField(
            model_name='slidervalue',
            name='timestamp',
            field=models.DateTimeField(default=datetime.datetime.now),
        ),
    ]
