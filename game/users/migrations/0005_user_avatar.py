# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-10-05 05:43
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_auto_20160911_0739'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.URLField(null=True),
        ),
    ]
