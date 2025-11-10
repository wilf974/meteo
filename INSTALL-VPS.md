# 📦 Installation VPS - MeteoProApp

Guide d'installation simplifié pour votre VPS.

## 🎯 Votre Configuration

- **IP VPS**: `168.231.84.168`
- **Domaine**: `meteoproapp.votredomaine.com` (remplacez par votre vrai domaine)
- **Répertoire**: `/opt/apps/meteo`

## 🚀 Installation en Une Commande

### Étape 1: Connectez-vous à votre VPS

```bash
ssh root@168.231.84.168
```

### Étape 2: Lancez l'installation

**Option A: Installation automatique complète**

Copiez-collez cette commande complète dans votre terminal VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/wilf974/meteo/claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc/scripts/vps-install.sh | bash -s -- meteoproapp.votredomaine.com admin@votredomaine.com
```

**Option B: Installation manuelle pas à pas**

Si vous préférez avoir plus de contrôle:

```bash
# 1. Installer les prérequis
apt-get update && apt-get upgrade -y

# 2. Installer Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 3. Installer Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. Installer Git
apt-get install -y git

# 5. Cloner le repository dans /opt/apps/meteo
mkdir -p /opt/apps
cd /opt/apps
git clone -b claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc https://github.com/wilf974/meteo.git
cd meteo

# 6. Configurer l'environnement
cp .env.production .env

# IMPORTANT: Éditer .env
nano .env
```

### Étape 3: Configurer .env

**Variables CRITIQUES à modifier dans `.env`:**

```bash
nano /opt/apps/meteo/.env
```

Modifiez ces lignes:

```env
# 1. Générer des mots de passe forts (gardez-les précieusement!)
DATABASE_PASSWORD=VotreMotDePasseFortAleatoire123!
REDIS_PASSWORD=VotreRedisPasswordFort456!
JWT_SECRET=VotreCleJWTSecreteTresLongueEtAleatoire789!

# 2. Votre clé API OpenWeatherMap (OBLIGATOIRE)
# Obtenir sur: https://openweathermap.org/api
OPENWEATHER_API_KEY=votre_vraie_cle_openweather_ici

# 3. Votre domaine
DOMAIN=meteoproapp.VOTRE-DOMAINE.com
EMAIL_ADMIN=votre-email@votredomaine.com

# 4. URLs (remplacer votredomaine.com)
VITE_API_URL=https://meteoproapp.VOTRE-DOMAINE.com
VITE_WS_URL=wss://meteoproapp.VOTRE-DOMAINE.com
CORS_ORIGIN=https://meteoproapp.VOTRE-DOMAINE.com
```

**Générer des mots de passe sécurisés:**

```bash
# Pour DATABASE_PASSWORD
openssl rand -base64 32

# Pour REDIS_PASSWORD
openssl rand -base64 32

# Pour JWT_SECRET
openssl rand -base64 64
```

**Obtenir la clé OpenWeatherMap (gratuit):**
1. Aller sur: https://openweathermap.org/api
2. Créer un compte gratuit
3. Générer une clé API
4. Copier la clé dans `OPENWEATHER_API_KEY`

Sauvegarder: `Ctrl+X`, puis `Y`, puis `Entrée`

### Étape 4: Mettre à jour Nginx avec votre domaine

```bash
cd /opt/apps/meteo

# Remplacer le domaine dans nginx.conf
sed -i 's/meteoproapp.votredomaine.com/meteoproapp.VOTRE-DOMAINE.com/g' nginx/nginx.conf
```

### Étape 5: Obtenir le certificat SSL

```bash
cd /opt/apps/meteo

# Créer les répertoires nécessaires
mkdir -p certbot/conf certbot/www backend/logs

# Créer une config Nginx temporaire pour le challenge SSL
cat > nginx/nginx.temp.conf << 'EOF'
server {
    listen 80;
    server_name meteoproapp.VOTRE-DOMAINE.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
EOF

# Sauvegarder la config originale et utiliser la temporaire
mv nginx/nginx.conf nginx/nginx.conf.full
mv nginx/nginx.temp.conf nginx/nginx.conf

# Démarrer Nginx temporaire
docker-compose up -d nginx

# Attendre un peu
sleep 5

# Obtenir le certificat Let's Encrypt
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email votre-email@votredomaine.com \
    --agree-tos \
    --no-eff-email \
    -d meteoproapp.VOTRE-DOMAINE.com

# Restaurer la config complète
mv nginx/nginx.conf.full nginx/nginx.conf

# Arrêter Nginx temporaire
docker-compose down
```

### Étape 6: Démarrer l'application

```bash
cd /opt/apps/meteo

# Build des images (peut prendre 5-10 minutes)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Démarrer tous les services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Attendre le démarrage (30 secondes)
sleep 30

# Vérifier le statut
docker-compose ps
```

### Étape 7: Configurer le firewall

```bash
# Installer UFW si nécessaire
apt-get install -y ufw

# Autoriser les ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# Activer le firewall
ufw enable

# Vérifier
ufw status
```

### Étape 8: Configurer le renouvellement automatique SSL

```bash
# Ajouter un cron job pour renouveler le certificat tous les jours à midi
(crontab -l 2>/dev/null; echo "0 12 * * * cd /opt/apps/meteo && docker-compose run --rm certbot renew && docker-compose exec nginx nginx -s reload") | crontab -
```

## ✅ Vérification

### 1. Vérifier que les services tournent

```bash
cd /opt/apps/meteo
docker-compose ps
```

Vous devriez voir:
- ✅ postgres (Up)
- ✅ redis (Up)
- ✅ backend (Up)
- ✅ frontend (Up)
- ✅ nginx (Up)

### 2. Voir les logs

```bash
# Tous les logs en temps réel
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Frontend uniquement
docker-compose logs -f frontend
```

### 3. Tester l'API

```bash
curl https://meteoproapp.VOTRE-DOMAINE.com/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "environment": "production"
}
```

### 4. Tester dans le navigateur

Ouvrir:
```
https://meteoproapp.VOTRE-DOMAINE.com
```

Vous devriez voir la page de connexion de MeteoProApp!

### 5. Créer votre premier compte

1. Cliquer sur "S'inscrire"
2. Remplir le formulaire
3. Vous serez automatiquement connecté
4. Explorer la carte interactive!

## 🔧 Commandes Utiles

```bash
# Aller dans le répertoire
cd /opt/apps/meteo

# Voir les logs en temps réel
docker-compose logs -f

# Voir le statut des services
docker-compose ps

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Redémarrer tous les services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Arrêter tous les services
docker-compose down

# Mise à jour après modification du code
git pull origin claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Backup de la base de données
./scripts/backup.sh

# Voir l'utilisation des ressources
docker stats

# Voir l'espace disque
df -h

# Nettoyer les anciennes images Docker (libérer de l'espace)
docker system prune -a
```

## 🐛 Dépannage

### Problème: "404 Not Found" lors du clone

**Solution:** Vérifiez que vous utilisez la bonne branche:

```bash
git clone -b claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc https://github.com/wilf974/meteo.git
```

### Problème: Le site n'est pas accessible

```bash
# 1. Vérifier que les services tournent
cd /opt/apps/meteo
docker-compose ps

# 2. Vérifier les logs
docker-compose logs nginx
docker-compose logs backend

# 3. Redémarrer
docker-compose restart
```

### Problème: "Cannot connect to database"

```bash
# Vérifier PostgreSQL
docker-compose logs postgres

# Redémarrer PostgreSQL et backend
docker-compose restart postgres
sleep 10
docker-compose restart backend
```

### Problème: Certificat SSL invalide

```bash
cd /opt/apps/meteo

# Renouveler le certificat
docker-compose run --rm certbot renew --force-renewal

# Redémarrer Nginx
docker-compose exec nginx nginx -s reload
```

### Problème: "Port already in use"

```bash
# Voir ce qui utilise le port 80
netstat -tulpn | grep :80

# Arrêter Apache/Nginx existant si présent
systemctl stop apache2
systemctl stop nginx
```

### Problème: Manque d'espace disque

```bash
# Voir l'espace disque
df -h

# Nettoyer Docker
docker system prune -a -f

# Supprimer les anciens backups
rm -f /var/backups/meteoproapp/*
```

## 📊 Monitoring

### Vérifier les ressources

```bash
# CPU et RAM en temps réel
docker stats

# Espace disque
df -h

# Logs système
journalctl -xe
```

### Logs importants

```bash
# Backend logs
docker-compose logs backend | tail -100

# Nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/meteoproapp_access.log

# Nginx error logs
docker-compose exec nginx tail -f /var/log/nginx/meteoproapp_error.log
```

## 🎉 Félicitations!

Votre application MeteoProApp est maintenant en production!

**Accès:** `https://meteoproapp.VOTRE-DOMAINE.com`

### Prochaines étapes

1. ✅ Créer votre compte administrateur
2. ✅ Tester toutes les fonctionnalités
3. ✅ Configurer vos alertes météo
4. ✅ Explorer les différentes couches de la carte
5. ✅ Inviter d'autres météorologues

### Support

- **Documentation complète**: `DEPLOYMENT.md`
- **Guide rapide**: `VPS-QUICKSTART.md`
- **README**: `README.md`
- **Issues GitHub**: https://github.com/wilf974/meteo/issues

Besoin d'aide? Consultez les fichiers de documentation ou ouvrez une issue sur GitHub!
