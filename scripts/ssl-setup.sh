#!/bin/bash

# Script pour configurer SSL avec Let's Encrypt
# Usage: ./scripts/ssl-setup.sh meteoproapp.votredomaine.com admin@votredomaine.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./scripts/ssl-setup.sh <domain> <email>"
    echo "Exemple: ./scripts/ssl-setup.sh meteoproapp.votredomaine.com admin@votredomaine.com"
    exit 1
fi

echo "🔒 Configuration SSL pour $DOMAIN..."

# Créer les répertoires nécessaires
mkdir -p certbot/conf
mkdir -p certbot/www

# Obtenir le certificat
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ Certificat SSL obtenu avec succès!"
    echo "Redémarrage de Nginx..."
    docker-compose exec nginx nginx -s reload
    echo "✅ Configuration terminée!"
else
    echo "❌ Erreur lors de l'obtention du certificat"
    exit 1
fi
