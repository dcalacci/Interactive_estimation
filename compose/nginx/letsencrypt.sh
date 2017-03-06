#!/bin/sh

mkdir -p {{ proxy_dir }}/www/{{ domain }}

docker pull quay.io/letsencrypt/letsencrypt

docker run -it --rm --name letsencrypt \
       -v "/etc/letsencrypt:/etc/letsencrypt" \
       -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
       --volumes-from {{ proxy_docker_container }} \
       quay.io/letsencrypt/letsencrypt \
       certonly \
       --webroot \
       --webroot-path /var/www/{{ domain }} \
       --agree-tos \
       --renew-by-default \
       -d {{ domain }} \
       -m {{ email }}

