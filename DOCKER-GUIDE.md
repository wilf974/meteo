# 🐳 Guide Docker - Application Météo Pro

Ce guide explique comment déployer l'application complète avec Docker et Docker Compose.

## 📋 Prérequis

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB espace disque

## 🏗️ Architecture

L'application se compose de 5 services Docker:

1. **frontend** - Interface React avec Nginx (Port 5173)
2. **backend** - API Node.js/Express (Port 5001)
3. **postgres** - Base de données PostgreSQL 15 (Port 5432)
4. **redis** - Cache Redis 7 (Port 6379)
5. **nginx** - Reverse proxy (Ports 80/443) - Production uniquement

## 🚀 Démarrage rapide (Développement)

### 1. Cloner et configurer

```bash
cd /home/user/meteo
cp .env.example .env
```

### 2. Éditer le fichier .env

```bash
# Configuration de base
DATABASE_PASSWORD=votre_mot_de_passe_postgres
REDIS_PASSWORD=votre_mot_de_passe_redis

# Configuration SMTP pour les emails quotidiens
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=votre_app_password
SMTP_FROM_EMAIL=votre.email@gmail.com
SMTP_FROM_NAME=Météo Pro
```

### 3. Lancer tous les services

```bash
docker-compose up -d
```

### 4. Vérifier le statut

```bash
docker-compose ps
```

### 5. Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 6. Accéder à l'application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- Health check: http://localhost:5001/health

## 🔧 Commandes utiles

### Rebuild après modifications de code

```bash
# Rebuild un service spécifique
docker-compose build backend
docker-compose build frontend

# Rebuild et redémarrer
docker-compose up -d --build backend
```

### Arrêter les services

```bash
# Arrêter sans supprimer
docker-compose stop

# Arrêter et supprimer les conteneurs
docker-compose down

# Arrêter et supprimer TOUT (conteneurs + volumes)
docker-compose down -v
```

### Accéder aux conteneurs

```bash
# Shell dans le backend
docker-compose exec backend sh

# Shell dans la base de données
docker-compose exec postgres psql -U postgres -d meteo_pro
```

### Voir les ressources utilisées

```bash
docker stats
```

## 🏭 Déploiement Production

### 1. Préparer l'environnement

```bash
# Créer le fichier .env.production
cp .env.example .env.production

# Éditer avec les valeurs de production
nano .env.production
```

### 2. Build et démarrage production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 3. Configuration SSL avec Certbot (première fois)

```bash
# Obtenir un certificat SSL
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d votre-domaine.com \
  -d www.votre-domaine.com \
  --email votre-email@example.com \
  --agree-tos \
  --no-eff-email
```

### 4. Vérifier les services

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## 📊 Système d'analytics et rapports quotidiens

Le backend inclut un système d'analytics automatique:

- **Tracking automatique**: Chaque connexion est enregistrée
- **Email quotidien**: Rapport envoyé à jean.maillot14@gmail.com à 20h chaque soir
- **Stockage persistant**: Les données sont stockées dans le volume `analytics_data`
- **Nettoyage automatique**: Les données de plus de 90 jours sont supprimées automatiquement

### Tester l'envoi de rapport

```bash
# Accéder au conteneur backend
docker-compose exec backend sh

# Tester l'envoi manuel
curl -X POST http://localhost:5001/api/v1/analytics/report \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.maillot14@gmail.com"}'
```

## 🔍 Monitoring et Debugging

### Health checks

Tous les services ont des health checks configurés:

```bash
# Vérifier la santé du backend
curl http://localhost:5001/health

# Vérifier via Docker
docker inspect --format='{{.State.Health.Status}}' meteo-backend
```

### Logs détaillés

```bash
# Logs en temps réel avec timestamps
docker-compose logs -f --timestamps

# Dernières 100 lignes
docker-compose logs --tail=100

# Logs d'un service spécifique
docker-compose logs backend | grep ERROR
```

### Performance

```bash
# Ressources utilisées par service
docker stats --no-stream

# Espace disque des volumes
docker system df -v
```

## 📦 Volumes et Données

### Volumes créés automatiquement

- `postgres_data` (dev) / `postgres_data_prod` (prod): Base de données PostgreSQL
- `redis_data` (dev) / `redis_data_prod` (prod): Cache Redis
- `analytics_data`: Données d'analytics (JSON)
- `nginx_logs` (prod): Logs Nginx

### Backup des données

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres meteo_pro > backup_$(date +%Y%m%d).sql

# Backup analytics
docker cp meteo-backend:/app/data/analytics.json analytics_backup_$(date +%Y%m%d).json

# Restaurer PostgreSQL
cat backup_20231113.sql | docker-compose exec -T postgres psql -U postgres meteo_pro
```

## 🔐 Sécurité

### Best practices appliquées

- ✅ Utilisateur non-root dans les conteneurs
- ✅ Secrets via variables d'environnement
- ✅ Health checks configurés
- ✅ Resource limits en production
- ✅ Volumes persistants pour les données
- ✅ Network isolation

### Sécuriser davantage

```bash
# Changer les mots de passe par défaut
# Éditer .env et mettre des mots de passe forts

# Limiter l'accès aux ports (production)
# Modifier docker-compose.prod.yml pour exposer uniquement 80/443
```

## 🐛 Troubleshooting

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier la connexion à PostgreSQL
docker-compose exec backend sh
nc -zv postgres 5432

# Vérifier les variables d'environnement
docker-compose exec backend env | grep DATABASE
```

### Frontend n'est pas accessible

```bash
# Vérifier que le build est terminé
docker-compose logs frontend

# Rebuild si nécessaire
docker-compose up -d --build frontend
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est prêt
docker-compose exec postgres pg_isready

# Recréer la base de données si nécessaire
docker-compose down
docker volume rm meteo_postgres_data
docker-compose up -d
```

### Les emails ne sont pas envoyés

```bash
# Vérifier la configuration SMTP
docker-compose exec backend sh
cat /app/.env | grep SMTP

# Tester manuellement l'envoi
curl -X POST http://localhost:5001/api/v1/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com"}'
```

## 🔄 Mise à jour de l'application

```bash
# 1. Pull les dernières modifications
git pull origin main

# 2. Rebuild les images
docker-compose build --no-cache

# 3. Redémarrer avec les nouvelles images
docker-compose up -d

# 4. Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f --tail=50
```

## 🧹 Nettoyage

```bash
# Supprimer les images non utilisées
docker image prune -a

# Supprimer les volumes non utilisés
docker volume prune

# Nettoyage complet du système
docker system prune -a --volumes
```

## 📝 Notes importantes

1. **Première installation**: La première exécution peut prendre 5-10 minutes pour télécharger les images et build
2. **Base de données**: Les migrations s'exécutent automatiquement au démarrage du backend
3. **Emails quotidiens**: Le scheduler cron s'active automatiquement et envoie le rapport à 20h00 (Europe/Paris)
4. **Analytics**: Le tracking commence dès la première visite sur l'application
5. **Resource limits**: En production, des limites CPU/RAM sont appliquées pour éviter la surconsommation

## 🆘 Support

Pour plus d'aide:
- Consulter les logs: `docker-compose logs`
- Vérifier la documentation du projet: README.md
- Issues GitHub: [lien vers le repo]

---

**Version Docker**: 1.0.0
**Dernière mise à jour**: 13 Novembre 2025
