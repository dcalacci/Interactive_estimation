# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-09-11 21:54
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('control', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='control',
            name='end_time',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='control',
            name='start_time',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='control',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
