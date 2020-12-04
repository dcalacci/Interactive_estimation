# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2016-10-21 21:18
from __future__ import unicode_literals

from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('round', '0005_auto_20161021_0438'),
    ]

    operations = [
        migrations.AlterField(
            model_name='round',
            name='guess',
            field=models.DecimalField(decimal_places=2, default=Decimal('NaN'), max_digits=3),
        ),
    ]