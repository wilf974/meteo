# ⚡ Démarrage Rapide VPS - MeteoProApp

Guide ultra-rapide pour déployer en production sur votre VPS avec HTTPS.

## 🎯 Informations VPS

- **IP**: `168.231.84.168`
- **Domaine**: `meteoproapp.votredomaine.com` (DNS A déjà configuré ✅)
- **Ports nécessaires**: 80, 443, 22

## 🚀 Déploiement en 5 Minutes

### Étape 1: Connexion au VPS

```bash
ssh root@168.231.84.168
```

### Étape 2: Installation Automatique

```bash
# Télécharger et exécuter le script de déploiement
curl -o deploy.sh https://raw.githubusercontent.com/votre-repo/meteo/main/scripts/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**OU** si vous avez déjà le code localement:

```bash
# Sur votre machine locale, transférer le code
scp -r /chemin/local/meteo root@168.231.84.168:/var/www/

# Sur le VPS
cd /var/www/meteo
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Étape 3: Configuration

Le script va vous demander d'éditer le fichier `.env`. **Modifiez ces valeurs:**

```bash
nano .env
```

**Variables CRITIQUES:**

```env
# 1. Mots de passe sécurisés (générez-les avec: openssl rand -base64 32)
DATABASE_PASSWORD=VotreMotDePasseFortAleatoire123!
REDIS_PASSWORD=VotreRedisPasswordFort456!
JWT_SECRET=VotreCleJWTSecreteTresLongueEtAleatoire789!

# 2. Votre clé API OpenWeatherMap (OBLIGATOIRE)
OPENWEATHER_API_KEY=votre_vraie_cle_openweather

# 3. Votre domaine
DOMAIN=meteoproapp.votredomaine.com
EMAIL_ADMIN=votre-email@votredomaine.com
```

**Obtenir la clé OpenWeatherMap (gratuit):**
1. Créer un compte sur https://openweathermap.org/api
2. Générer une clé API gratuite
3. Copier la clé dans `OPENWEATHER_API_KEY`

### Étape 4: Vérification

Ouvrir dans votre navigateur:
```
https://meteoproapp.votredomaine.com
```

**Test API:**
```bash
curl https://meteoproapp.votredomaine.com/health
```

## 🛠️ Déploiement Manuel (Alternative)

Si vous préférez le contrôle total:

### 1. Installer Docker

```bash
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Préparer l'application

```bash
mkdir -p /var/www/meteoproapp
cd /var/www/meteoproapp

# Cloner votre repo
git clone https://github.com/votre-username/meteo.git .

# OU copier depuis local
# scp -r /local/meteo root@168.231.84.168:/var/www/meteoproapp
```

### 3. Configurer

```bash
# Copier et éditer .env
cp .env.production .env
nano .env

# Mettre à jour le domaine dans Nginx
sed -i 's/meteoproapp.votredomaine.com/meteoproapp.VOTRE-DOMAINE.com/g' nginx/nginx.conf
```

### 4. Obtenir SSL

```bash
# Préparer les répertoires
mkdir -p certbot/conf certbot/www

# Démarrer Nginx temporaire
docker-compose up -d nginx

# Obtenir le certificat
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email votre-email@votredomaine.com \
    --agree-tos \
    -d meteoproapp.votre-domaine.com

# Arrêter
docker-compose down
```

### 5. Démarrer en production

```bash
# Build et démarrage
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérifier
docker-compose ps
docker-compose logs -f
```

## 🔥 Commandes Essentielles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Mise à jour après modification du code
cd /var/www/meteoproapp
git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Arrêter
docker-compose down

# Backup base de données
./scripts/backup.sh

# Vérifier le statut
docker-compose ps
```

## 🐛 Dépannage Rapide

### Le site ne charge pas

```bash
# Vérifier les conteneurs
docker-compose ps

# Voir les erreurs
docker-compose logs nginx
docker-compose logs backend

# Redémarrer tout
docker-compose restart
```

### Erreur "Cannot connect to database"

```bash
# Vérifier PostgreSQL
docker-compose logs postgres

# Redémarrer
docker-compose restart postgres backend
```

### SSL ne fonctionne pas

```bash
# Renouveler le certificat
docker-compose run --rm certbot renew --force-renewal
docker-compose exec nginx nginx -s reload
```

### Voir l'utilisation des ressources

```bash
# CPU et RAM
docker stats

# Espace disque
df -h
```

## 📋 Checklist Post-Déploiement

- [ ] Site accessible via HTTPS ✅
- [ ] Certificat SSL valide (cadenas vert) ✅
- [ ] API répond sur `/health` ✅
- [ ] WebSocket connecté (console navigateur) ✅
- [ ] Inscription fonctionne ✅
- [ ] Connexion fonctionne ✅
- [ ] Carte interactive s'affiche ✅
- [ ] Données météo se chargent ✅
- [ ] Firewall configuré (ports 80, 443, 22) ✅
- [ ] Backups configurés ✅
- [ ] Renouvellement SSL automatique ✅

## 🎉 Vous avez fini!

Votre application est maintenant en production sur:
**https://meteoproapp.votredomaine.com**

### Prochaines étapes

1. Créer votre premier compte utilisateur
2. Configurer vos alertes météo
3. Explorer les différentes couches de la carte
4. Inviter d'autres météorologues

### Support

- Documentation complète: [DEPLOYMENT.md](DEPLOYMENT.md)
- Guide utilisateur: [README.md](README.md)
- Issues GitHub: https://github.com/votre-repo/issues

---

**Besoin d'aide?** Consultez [DEPLOYMENT.md](DEPLOYMENT.md) pour le guide détaillé.
