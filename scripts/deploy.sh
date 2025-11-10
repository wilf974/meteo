#!/bin/bash

# Script de déploiement automatisé pour MeteoProApp sur VPS
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Déploiement de MeteoProApp sur VPS..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DOMAIN="meteoproapp.votredomaine.com"
EMAIL="admin@votredomaine.com"
APP_DIR="/var/www/meteoproapp"

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en tant que root"
    exit 1
fi

# 1. Mise à jour du système
log_info "Mise à jour du système..."
apt-get update
apt-get upgrade -y

# 2. Installation de Docker
if ! command -v docker &> /dev/null; then
    log_info "Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
else
    log_info "Docker est déjà installé"
fi

# 3. Installation de Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_info "Installation de Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    log_info "Docker Compose est déjà installé"
fi

# 4. Créer le répertoire de l'application
log_info "Création du répertoire de l'application..."
mkdir -p $APP_DIR
cd $APP_DIR

# 5. Cloner ou mettre à jour le repository
if [ -d ".git" ]; then
    log_info "Mise à jour du repository..."
    git pull origin main
else
    log_info "Clonage du repository..."
    # Remplacer par votre URL de repository
    git clone https://github.com/votre-username/meteo.git .
fi

# 6. Copier le fichier .env.production vers .env
log_info "Configuration des variables d'environnement..."
if [ ! -f ".env" ]; then
    cp .env.production .env
    log_warn "IMPORTANT: Éditer le fichier .env avec vos vraies valeurs:"
    log_warn "  - DATABASE_PASSWORD"
    log_warn "  - REDIS_PASSWORD"
    log_warn "  - JWT_SECRET"
    log_warn "  - OPENWEATHER_API_KEY"
    log_warn "  - DOMAIN et EMAIL_ADMIN"
    read -p "Appuyez sur Entrée après avoir édité .env..."
fi

# 7. Mettre à jour le domaine dans nginx.conf
log_info "Configuration de Nginx avec le domaine..."
sed -i "s/meteoproapp.votredomaine.com/$DOMAIN/g" nginx/nginx.conf
sed -i "s/admin@votredomaine.com/$EMAIL/g" .env

# 8. Créer les répertoires nécessaires
log_info "Création des répertoires..."
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p backend/logs

# 9. Obtenir le certificat SSL initial (sans SSL d'abord)
log_info "Obtention du certificat SSL Let's Encrypt..."

# Créer une config Nginx temporaire pour le challenge
cat > nginx/nginx.conf.temp << EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'Initializing...';
        add_header Content-Type text/plain;
    }
}
EOF

# Sauvegarder la config originale
mv nginx/nginx.conf nginx/nginx.conf.full
mv nginx/nginx.conf.temp nginx/nginx.conf

# Démarrer Nginx temporairement
docker-compose up -d nginx

# Obtenir le certificat
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

# Restaurer la config complète
mv nginx/nginx.conf.full nginx/nginx.conf

# 10. Arrêter les conteneurs temporaires
log_info "Arrêt des conteneurs temporaires..."
docker-compose down

# 11. Build et démarrage en production
log_info "Build et démarrage des conteneurs en production..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 12. Attendre que les services démarrent
log_info "Attente du démarrage des services..."
sleep 30

# 13. Vérifier le statut
log_info "Vérification du statut des services..."
docker-compose ps

# 14. Test de santé
log_info "Test de santé de l'API..."
if curl -f https://$DOMAIN/health; then
    log_info "✅ L'API répond correctement!"
else
    log_error "❌ L'API ne répond pas"
fi

# 15. Configuration du firewall
log_info "Configuration du firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    ufw --force enable
fi

# 16. Créer un cron job pour le renouvellement SSL
log_info "Configuration du renouvellement automatique SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * cd $APP_DIR && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T certbot renew && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T nginx nginx -s reload") | crontab -

echo ""
log_info "=========================================="
log_info "✅ Déploiement terminé avec succès!"
log_info "=========================================="
echo ""
log_info "Votre application est accessible sur:"
log_info "  👉 https://$DOMAIN"
echo ""
log_info "Commandes utiles:"
log_info "  - Voir les logs: docker-compose logs -f"
log_info "  - Redémarrer: docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"
log_info "  - Arrêter: docker-compose down"
log_info "  - Mise à jour: git pull && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
echo ""
log_warn "N'oubliez pas de:"
log_warn "  1. Vérifier votre fichier .env"
log_warn "  2. Configurer vos clés API météo"
log_warn "  3. Tester l'inscription et la connexion"
echo ""
