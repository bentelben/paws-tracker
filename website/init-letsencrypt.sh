#!/bin/bash
source .env

LIVE_PATH="./certbot/conf/live/$MAIN_CERTIFICATE_DOMAIN"

mkdir -p "$LIVE_PATH"

openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$LIVE_PATH/privkey.pem" \
    -out "$LIVE_PATH/fullchain.pem" \
    -subj "/CN=localhost"

docker compose up --force-recreate -d nginx

docker compose run --rm --entrypoint "\
        rm -fr /etc/letsencrypt/live/$MAIN_CERTIFICATE_DOMAIN" certbot

domain_args=""
for domain in $DOMAINS; do
    domain_args="$domain_args -d $domain"
done

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $domain_args \
    --cert-name $MAIN_CERTIFICATE_DOMAIN \
    --email $CERTBOT_USER_EMAIL \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

docker compose exec nginx nginx -s reload
docker compose up -d certbot