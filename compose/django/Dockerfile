FROM python:3.5

ENV PYTHONUNBUFFERED 1

# Requirements have to be pulled and installed here, otherwise caching won't work
COPY ./requirements /requirements

RUN pip install -r /requirements/production.txt \
    && groupadd -r django \
    && useradd -r -g django django

COPY . /app
RUN chown -R django /app

# COPY ./compose/django/gunicorn.sh /gunicorn.sh
COPY ./compose/django/daphne.sh /daphne.sh
COPY ./compose/django/entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r//' /entrypoint.sh \
    && sed -i 's/\r//' /daphne.sh \
    && chmod +x /entrypoint.sh \
    && chown django /entrypoint.sh \
    && chown django /daphne.sh \
    && chmod +x /daphne.sh 
    
    # && sed -i 's/\r//' /gunicorn.sh \
    # && chmod +x /gunicorn.sh \
    # && chown django /gunicorn.sh

WORKDIR /app

run gulp build

ENTRYPOINT ["/entrypoint.sh"]
