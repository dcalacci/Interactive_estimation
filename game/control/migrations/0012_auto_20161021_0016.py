# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-10-21 00:16
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('control', '0011_survey'),
    ]

    operations = [
        migrations.AlterField(
            model_name='survey',
            name='gender',
            field=models.TextField(null=True),
        ),
    ]
