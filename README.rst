Game
==============================

It

.. image:: https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg
     :target: https://github.com/pydanny/cookiecutter-django/
     :alt: Built with Cookiecutter Django


LICENSE: MIT


Settings
------------

Moved to settings_.

.. _settings: http://cookiecutter-django.readthedocs.io/en/latest/settings.html

Basic Commands
--------------

Setting Up Your Users
^^^^^^^^^^^^^^^^^^^^^


* To create a **normal user account**, just go to Sign Up and fill out the form. Once you submit it, you'll see a "Verify Your E-mail Address" page. Go to your console to see a simulated email verification message. Copy the link into your browser. Now the user's email should be verified and ready to go.

* To create an **superuser account**, use this command::

    $ python manage.py createsuperuser

For convenience, you can keep your normal user logged in on Chrome and your superuser logged in on Firefox (or similar), so that you can see how the site behaves for both kinds of users.

Test coverage
^^^^^^^^^^^^^

lol



Deployment
----------
dev **deploy**::
  $ gulp build
  $ docker-compose -f dev.yml build
  $ docker-compose -f dev.yml up
  $ docker-compose -f dev.yml run django /app/manage.py loaddata fixtures/initial_round.json
  
The loaddata command must be run after `docker-compose up` has been run at least once (for migrations)
There's probably a way around that but I haven't looked into it yet

