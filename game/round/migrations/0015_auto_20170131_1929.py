# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2017-01-31 19:29
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('round', '0014_auto_20170131_1924'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='slidervalue',
            name='user',
        ),
        migrations.DeleteModel(
            name='SliderValue',
        ),
    ]
