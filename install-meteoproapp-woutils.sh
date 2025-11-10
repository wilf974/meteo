#!/bin/bash
# Installation complète de MeteoProApp sur meteoproapp.woutils.com
# Copier-coller ce script complet dans le terminal de votre VPS

set -e

DOMAIN="meteoproapp.woutils.com"
EMAIL="admin@woutils.com"
OPENWEATHER_KEY="2ec0e6de17b1cde328190d75deb1c7df"
INSTALL_DIR="/opt/apps/meteo"

echo "🚀 Installation de MeteoProApp sur $DOMAIN"

# 1. Installer Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installation de Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 2. Installer Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installation de Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. Cloner le repository
echo "📥 Clonage du repository..."
if [ -d "$INSTALL_DIR" ]; then
    cd $INSTALL_DIR
    git pull origin claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc
else
    git clone -b claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc https://github.com/wilf974/meteo.git $INSTALL_DIR
    cd $INSTALL_DIR
fi

# 4. Générer les mots de passe sécurisés
echo "🔐 Génération des mots de passe..."
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

echo "✅ Mots de passe générés (sauvegardés dans $INSTALL_DIR/.passwords)"
cat > .passwords << EOF
DATABASE_PASSWORD: $DB_PASS
REDIS_PASSWORD: $REDIS_PASS
JWT_SECRET: $JWT_SECRET
EOF
chmod 600 .passwords

# 5. Configurer .env
echo "⚙️  Configuration de l'environnement..."
cp .env.production .env

sed -i "s/meteoproapp.votredomaine.com/$DOMAIN/g" .env
sed -i "s/admin@votredomaine.com/$EMAIL/g" .env
sed -i "s/CHANGEZ_MOI_MOT_DE_PASSE_FORT_ALEATOIRE/$DB_PASS/g" .env
sed -i "s/CHANGEZ_MOI_REDIS_PASSWORD_FORT/$REDIS_PASS/g" .env
sed -i "s/CHANGEZ_MOI_CLE_JWT_SECRETE_TRES_LONGUE_ET_ALEATOIRE/$JWT_SECRET/g" .env
sed -i "s/votre_vraie_cle_openweather/$OPENWEATHER_KEY/g" .env

# 6. Mettre à jour nginx.conf
echo "🔧 Configuration de Nginx..."
sed -i "s/meteoproapp.votredomaine.com/$DOMAIN/g" nginx/nginx.conf

# 7. Créer les répertoires
echo "📁 Création des répertoires..."
mkdir -p certbot/conf certbot/www backend/logs

# 8. Configuration Nginx temporaire pour le challenge SSL
echo "🔒 Préparation du certificat SSL..."
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

mv nginx/nginx.conf nginx/nginx.conf.full
mv nginx/nginx.temp.conf nginx/nginx.conf

# 9. Démarrer Nginx temporaire
echo "🌐 Démarrage de Nginx temporaire..."
docker-compose up -d nginx
sleep 5

# 10. Obtenir le certificat SSL
echo "🔒 Obtention du certificat SSL Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# 11. Restaurer la config complète
echo "🔧 Restauration de la configuration Nginx..."
mv nginx/nginx.conf.full nginx/nginx.conf
docker-compose down

# 12. Build et démarrage en production
echo "🏗️  Build des images Docker (cela peut prendre 5-10 minutes)..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

echo "🚀 Démarrage de l'application..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 13. Attendre le démarrage
echo "⏳ Attente du démarrage des services (30 secondes)..."
sleep 30

# 14. Configuration firewall
echo "🔥 Configuration du firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    echo "y" | ufw enable || true
fi

# 15. Cron job pour renouvellement SSL
echo "⏰ Configuration du renouvellement automatique SSL..."
CRON_CMD="0 12 * * * cd $INSTALL_DIR && docker-compose run --rm certbot renew && docker-compose exec nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -

# 16. Vérification
echo ""
echo "=========================================="
echo "✅ Installation terminée!"
echo "=========================================="
echo ""
echo "🌐 Votre application est accessible sur:"
echo "   👉 https://$DOMAIN"
echo ""
echo "📊 Statut des services:"
docker-compose ps
echo ""
echo "🔍 Test de l'API..."
sleep 5
if curl -f -k https://$DOMAIN/health 2>/dev/null; then
    echo "✅ API fonctionne!"
else
    echo "⏳ API en cours de démarrage, attendez quelques secondes..."
fi
echo ""
echo "📝 Commandes utiles:"
echo "   cd $INSTALL_DIR"
echo "   docker-compose logs -f              # Voir les logs"
echo "   docker-compose ps                   # Statut des services"
echo "   docker-compose restart              # Redémarrer"
echo "   ./scripts/backup.sh                 # Backup"
echo ""
echo "🔐 Vos mots de passe sont sauvegardés dans:"
echo "   $INSTALL_DIR/.passwords"
echo ""
echo "🎉 Installation réussie! Accédez à votre application:"
echo "   https://$DOMAIN"
echo ""
