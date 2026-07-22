if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "Ошибка: Файл .env не найден в текущей директории!"
    exit 1
fi

mkdir -p ./data/certbot/conf/live/${MAIN_CERTIFICATE_DOMAIN}
touch ./data/certbot/conf/live/${MAIN_CERTIFICATE_DOMAIN}/fullchain.pem
touch ./data/certbot/conf/live/${MAIN_CERTIFICATE_DOMAIN}/privkey.pem

docker compose up -d --build

docker compose run --rm certbot certonly \
    --webroot --webroot-path=/var/www/html \
    --email ${CERTBOT_USER_EMAIL} \
    --agree-tos --no-eff-email \
    --force-renewal \
    --domains "${HOSTS}"

docker compose down