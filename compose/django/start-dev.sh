#!/bin/sh
#python manage.py migrate
echo `pwd`
echo `ls`
echo `ls rtc`
python /app/manage.py runserver 0.0.0.0:8000
