# 🚀 Guide de Déploiement VPS - MeteoProApp

Guide complet pour déployer MeteoProApp sur votre VPS avec HTTPS.

## 📋 Prérequis

### VPS
- Ubuntu 20.04 LTS ou supérieur (recommandé)
- Minimum 2 CPU, 4GB RAM, 40GB disque
- Accès root ou sudo
- IP publique: `168.231.84.168`

### DNS
✅ Configuration DNS (déjà fait):
```
Type: A
Nom: meteoproapp
Valeur: 168.231.84.168
TTL: 300
```

Votre domaine sera: `meteoproapp.votredomaine.com`

### Ports
Les ports suivants doivent être ouverts:
- `80` (HTTP - redirection vers HTTPS)
- `443` (HTTPS)
- `22` (SSH - pour administration)

## 🚀 Déploiement Automatisé

### Option 1: Script Automatique (Recommandé)

```bash
# 1. Se connecter au VPS
ssh root@168.231.84.168

# 2. Télécharger le script de déploiement
curl -o deploy.sh https://raw.githubusercontent.com/votre-repo/meteo/main/scripts/deploy.sh
chmod +x deploy.sh

# 3. Lancer le déploiement
./deploy.sh
```

Le script va:
- ✅ Installer Docker et Docker Compose
- ✅ Cloner le repository
- ✅ Configurer les variables d'environnement
- ✅ Obtenir le certificat SSL Let's Encrypt
- ✅ Build et démarrer tous les services
- ✅ Configurer le renouvellement automatique SSL
- ✅ Configurer le firewall

### Option 2: Déploiement Manuel

#### 1. Connexion au VPS

```bash
ssh root@168.231.84.168
```

#### 2. Installation de Docker

```bash
# Mise à jour du système
apt-get update && apt-get upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Installation de Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

#### 3. Installation de l'application

```bash
# Créer le répertoire
mkdir -p /var/www/meteoproapp
cd /var/www/meteoproapp

# Cloner le repository
git clone https://github.com/votre-username/meteo.git .

# Ou télécharger depuis votre serveur local
# scp -r /chemin/local/meteo root@168.231.84.168:/var/www/meteoproapp
```

#### 4. Configuration

```bash
# Copier le fichier d'environnement
cp .env.production .env

# IMPORTANT: Éditer .env avec vos vraies valeurs
nano .env
```

**Variables CRITIQUES à modifier dans `.env`:**

```env
# Génerer un mot de passe fort
DATABASE_PASSWORD=VotreMotDePasseFortAleatoire123!

# Générer un mot de passe Redis
REDIS_PASSWORD=VotreRedisPasswordFort456!

# Générer une clé JWT (utilisez: openssl rand -base64 64)
JWT_SECRET=VotreCleJWTSecreteTresLongueEtAleatoire789!

# Votre clé API OpenWeatherMap
OPENWEATHER_API_KEY=votre_vraie_cle_ici

# Votre domaine
DOMAIN=meteoproapp.votredomaine.com
EMAIL_ADMIN=votre-email@votredomaine.com

# URLs frontend
VITE_API_URL=https://meteoproapp.votredomaine.com
VITE_WS_URL=wss://meteoproapp.votredomaine.com

# CORS
CORS_ORIGIN=https://meteoproapp.votredomaine.com
```

**Générer des mots de passe sécurisés:**
```bash
# Mot de passe database
openssl rand -base64 32

# Mot de passe Redis
openssl rand -base64 32

# Clé JWT
openssl rand -base64 64
```

#### 5. Mettre à jour Nginx avec votre domaine

```bash
# Remplacer le domaine dans la config Nginx
sed -i 's/meteoproapp.votredomaine.com/meteoproapp.VOTRE-DOMAINE.com/g' nginx/nginx.conf
```

#### 6. Obtenir le certificat SSL

```bash
# Créer les répertoires
mkdir -p certbot/conf certbot/www

# Démarrer Nginx temporairement (sans SSL)
docker-compose up -d nginx

# Obtenir le certificat Let's Encrypt
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email votre-email@votredomaine.com \
    --agree-tos \
    --no-eff-email \
    -d meteoproapp.VOTRE-DOMAINE.com

# Arrêter Nginx temporaire
docker-compose down
```

#### 7. Démarrer l'application en production

```bash
# Build des images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Démarrer tous les services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Attendre 30 secondes pour le démarrage
sleep 30

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

#### 8. Vérification

```bash
# Test de santé API
curl https://meteoproapp.votredomaine.com/health

# Vérifier les conteneurs
docker-compose ps

# Logs backend
docker-compose logs backend

# Logs frontend
docker-compose logs frontend
```

#### 9. Configurer le firewall

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

#### 10. Renouvellement automatique SSL

```bash
# Créer un cron job pour renouveler le certificat tous les jours à midi
echo "0 12 * * * cd /var/www/meteoproapp && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T certbot renew && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T nginx nginx -s reload" | crontab -
```

## ✅ Vérification du Déploiement

### 1. Tester le site web
Ouvrir dans le navigateur:
```
https://meteoproapp.votredomaine.com
```

### 2. Tester l'API
```bash
curl https://meteoproapp.votredomaine.com/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "environment": "production"
}
```

### 3. Tester le WebSocket
Ouvrir la console développeur du navigateur et vérifier les connexions WebSocket

### 4. Vérifier le SSL
```bash
# Tester le certificat SSL
echo | openssl s_client -servername meteoproapp.votredomaine.com -connect meteoproapp.votredomaine.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 📊 Commandes de Gestion

### Logs
```bash
# Tous les logs
docker-compose logs -f

# Logs backend uniquement
docker-compose logs -f backend

# Logs frontend
docker-compose logs -f frontend

# Logs Nginx
docker-compose logs -f nginx

# Logs dernières 100 lignes
docker-compose logs --tail=100
```

### Redémarrage
```bash
# Redémarrer tous les services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Redémarrer un service spécifique
docker-compose restart backend
docker-compose restart frontend
docker-compose restart nginx
```

### Mise à jour
```bash
# Aller dans le répertoire
cd /var/www/meteoproapp

# Pull les dernières modifications
git pull origin main

# Rebuild et redémarrer
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Voir les logs pour vérifier
docker-compose logs -f
```

### Arrêt
```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: perte de données)
docker-compose down -v
```

### Sauvegarde
```bash
# Exécuter le script de backup
./scripts/backup.sh

# Ou manuellement
docker-compose exec -T postgres pg_dump -U postgres meteo_pro_production > backup_$(date +%Y%m%d).sql
```

## 🔧 Dépannage

### Problème: Le site n'est pas accessible

1. Vérifier que les services tournent:
```bash
docker-compose ps
```

2. Vérifier les logs:
```bash
docker-compose logs nginx
docker-compose logs backend
```

3. Vérifier les ports:
```bash
netstat -tulpn | grep -E ':(80|443)'
```

4. Tester localement:
```bash
curl http://localhost
```

### Problème: Erreur SSL

1. Vérifier le certificat:
```bash
ls -la certbot/conf/live/meteoproapp.votredomaine.com/
```

2. Renouveler manuellement:
```bash
docker-compose run --rm certbot renew --force-renewal
docker-compose exec nginx nginx -s reload
```

### Problème: Base de données ne démarre pas

1. Vérifier les logs:
```bash
docker-compose logs postgres
```

2. Vérifier l'espace disque:
```bash
df -h
```

3. Redémarrer:
```bash
docker-compose restart postgres
```

### Problème: Erreur "Cannot connect to database"

1. Vérifier que PostgreSQL tourne:
```bash
docker-compose ps postgres
```

2. Vérifier les variables d'environnement:
```bash
docker-compose exec backend env | grep DATABASE
```

3. Tester la connexion:
```bash
docker-compose exec backend node -e "require('./dist/config/database').AppDataSource.initialize().then(() => console.log('OK')).catch(console.error)"
```

## 📈 Monitoring

### Vérifier l'utilisation des ressources
```bash
# CPU et RAM
docker stats

# Espace disque
df -h

# Logs système
journalctl -xe
```

### Surveiller les logs en temps réel
```bash
# Terminal 1: Backend
docker-compose logs -f backend

# Terminal 2: Frontend
docker-compose logs -f frontend

# Terminal 3: Nginx
docker-compose logs -f nginx
```

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ Changer TOUS les mots de passe par défaut
2. ✅ Utiliser des mots de passe forts (32+ caractères)
3. ✅ Activer le firewall (UFW)
4. ✅ Maintenir le système à jour
5. ✅ Sauvegarder régulièrement
6. ✅ Monitorer les logs
7. ✅ Restreindre l'accès SSH (clés uniquement)

### Mise à jour de sécurité
```bash
# Mise à jour système
apt-get update && apt-get upgrade -y

# Mise à jour Docker
curl -fsSL https://get.docker.com | sh

# Redémarrer les services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

## 📞 Support

En cas de problème:
1. Vérifier les logs: `docker-compose logs -f`
2. Consulter ce guide de dépannage
3. Ouvrir une issue GitHub
4. Contacter l'équipe de développement

## 🎉 Félicitations!

Votre application MeteoProApp est maintenant déployée en production sur:
**https://meteoproapp.votredomaine.com**

N'oubliez pas de:
- ✅ Tester l'inscription/connexion
- ✅ Configurer vos alertes
- ✅ Explorer la carte interactive
- ✅ Mettre en place les sauvegardes automatiques
