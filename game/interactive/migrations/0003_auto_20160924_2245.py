# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-09-24 22:45
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interactive', '0002_auto_20160924_2245'),
    ]

    operations = [
        migrations.AlterField(
            model_name='roundinteractive',
            name='influencers',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL),
        ),
    ]
