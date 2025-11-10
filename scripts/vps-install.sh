#!/bin/bash

# Script d'installation ultra-simple pour VPS
# Copier-coller ce script directement dans le terminal du VPS

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Installation de MeteoProApp sur VPS${NC}"

# Variables à modifier
DOMAIN="meteoproapp.votredomaine.com"
EMAIL="admin@votredomaine.com"
GITHUB_REPO="https://github.com/wilf974/meteo.git"
BRANCH="claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc"
INSTALL_DIR="/opt/apps/meteo"

# 1. Mise à jour système
echo -e "${GREEN}[1/8] Mise à jour du système...${NC}"
apt-get update && apt-get upgrade -y

# 2. Installation Docker
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}[2/8] Installation de Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
else
    echo -e "${GREEN}[2/8] Docker déjà installé${NC}"
fi

# 3. Installation Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}[3/8] Installation de Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}[3/8] Docker Compose déjà installé${NC}"
fi

# 4. Installation Git
if ! command -v git &> /dev/null; then
    echo -e "${GREEN}[4/8] Installation de Git...${NC}"
    apt-get install -y git
else
    echo -e "${GREEN}[4/8] Git déjà installé${NC}"
fi

# 5. Clonage du repository
echo -e "${GREEN}[5/8] Clonage du repository...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo "Le répertoire existe déjà. Mise à jour..."
    cd $INSTALL_DIR
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    mkdir -p $(dirname $INSTALL_DIR)
    git clone -b $BRANCH $GITHUB_REPO $INSTALL_DIR
    cd $INSTALL_DIR
fi

# 6. Configuration
echo -e "${GREEN}[6/8] Configuration de l'application...${NC}"
if [ ! -f ".env" ]; then
    cp .env.production .env

    # Générer des mots de passe sécurisés
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

    # Remplacer dans .env
    sed -i "s/CHANGEZ_MOI_MOT_DE_PASSE_FORT_ALEATOIRE/$DB_PASSWORD/g" .env
    sed -i "s/CHANGEZ_MOI_REDIS_PASSWORD_FORT/$REDIS_PASSWORD/g" .env
    sed -i "s/CHANGEZ_MOI_CLE_JWT_SECRETE_TRES_LONGUE_ET_ALEATOIRE/$JWT_SECRET/g" .env
    sed -i "s/meteoproapp.votredomaine.com/$DOMAIN/g" .env
    sed -i "s/admin@votredomaine.com/$EMAIL/g" .env

    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Éditez le fichier .env et ajoutez votre clé API OpenWeatherMap${NC}"
    echo -e "${YELLOW}   Ligne à modifier: OPENWEATHER_API_KEY=votre_vraie_cle_openweather${NC}"
    echo ""
    echo -e "${YELLOW}   Obtenez une clé gratuite sur: https://openweathermap.org/api${NC}"
    echo ""
    read -p "Appuyez sur Entrée après avoir édité .env avec nano .env..."
fi

# Mettre à jour nginx.conf avec le bon domaine
sed -i "s/meteoproapp.votredomaine.com/$DOMAIN/g" nginx/nginx.conf

# 7. Création des répertoires nécessaires
echo -e "${GREEN}[7/8] Création des répertoires...${NC}"
mkdir -p certbot/conf certbot/www backend/logs

# 8. Obtention du certificat SSL
echo -e "${GREEN}[8/8] Configuration SSL...${NC}"

# Config Nginx temporaire pour le challenge
cat > nginx/nginx.temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
EOF

# Sauvegarder config originale
if [ -f "nginx/nginx.conf" ]; then
    mv nginx/nginx.conf nginx/nginx.conf.full
fi
mv nginx/nginx.temp.conf nginx/nginx.conf

# Démarrer Nginx temporaire
docker-compose up -d nginx

# Attendre un peu
sleep 5

# Obtenir le certificat
echo "Obtention du certificat SSL Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Restaurer la config complète
if [ -f "nginx/nginx.conf.full" ]; then
    mv nginx/nginx.conf.full nginx/nginx.conf
fi

# Arrêter Nginx temporaire
docker-compose down

# 9. Démarrage en production
echo -e "${GREEN}Démarrage de l'application en production...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Attendre le démarrage
echo "Attente du démarrage des services (30 secondes)..."
sleep 30

# 10. Vérification
echo -e "${GREEN}Vérification du statut...${NC}"
docker-compose ps

# 11. Configuration firewall
echo -e "${GREEN}Configuration du firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    echo "y" | ufw enable || true
fi

# 12. Cron job pour renouvellement SSL
echo -e "${GREEN}Configuration du renouvellement automatique SSL...${NC}"
CRON_CMD="0 12 * * * cd $INSTALL_DIR && docker-compose run --rm certbot renew && docker-compose exec nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -

# 13. Test final
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Installation terminée!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Votre application est accessible sur:"
echo -e "${GREEN}👉 https://$DOMAIN${NC}"
echo ""
echo -e "Test de l'API:"
if curl -f -k https://$DOMAIN/health 2>/dev/null; then
    echo -e "${GREEN}✅ API fonctionne!${NC}"
else
    echo -e "${YELLOW}⚠️  API ne répond pas encore, attendez quelques secondes...${NC}"
fi
echo ""
echo -e "Commandes utiles:"
echo -e "  cd $INSTALL_DIR"
echo -e "  docker-compose logs -f              # Voir les logs"
echo -e "  docker-compose ps                   # Voir le statut"
echo -e "  docker-compose restart              # Redémarrer"
echo ""
echo -e "${YELLOW}N'oubliez pas:${NC}"
echo -e "  1. Vérifier votre clé API OpenWeatherMap dans .env"
echo -e "  2. Tester l'inscription sur https://$DOMAIN/register"
echo -e "  3. Créer votre premier compte utilisateur"
echo ""
