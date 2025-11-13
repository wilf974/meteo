# 🚀 Docker Quick Start

Déploiement complet de l'application Météo Pro en 5 minutes avec Docker.

## ⚡ Installation Express

### 1. Prérequis

```bash
# Vérifier Docker
docker --version  # 20.10+
docker-compose --version  # 2.0+
```

### 2. Configuration

```bash
cd /home/user/meteo

# Copier et éditer la configuration
cp .env.example .env
nano .env
```

**Variables essentielles à configurer:**

```env
# Base de données
DATABASE_PASSWORD=votre_mot_de_passe_fort

# Redis
REDIS_PASSWORD=votre_mot_de_passe_redis

# SMTP pour emails quotidiens
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=votre_app_password
SMTP_FROM_EMAIL=votre.email@gmail.com
```

### 3. Démarrer l'application

```bash
# Méthode 1: Script automatique
./docker-start.sh dev

# Méthode 2: Docker Compose manuel
docker-compose up -d
```

### 4. Vérifier que tout fonctionne

```bash
# Voir les services
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 5. Accéder à l'application

- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/health

## 🎯 Commandes Utiles

```bash
# Démarrer
./docker-start.sh dev

# Voir les logs
./docker-start.sh logs

# Voir le statut
./docker-start.sh status

# Arrêter
./docker-start.sh stop

# Rebuild après modification
./docker-start.sh rebuild
```

## 📊 Analytics & Emails

Le système d'analytics démarre automatiquement:

- ✅ Tracking des connexions activé
- ✅ Email quotidien à jean.maillot14@gmail.com à 20h
- ✅ Stockage persistant dans volume Docker
- ✅ Nettoyage auto des données >90 jours

### Tester l'email manuel

```bash
curl -X POST http://localhost:5001/api/v1/analytics/report \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.maillot14@gmail.com"}'
```

## 🔧 Troubleshooting

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs backend
docker-compose logs frontend

# Redémarrer proprement
docker-compose down
docker-compose up -d
```

### Rebuild complet

```bash
# Tout supprimer et reconstruire
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Accès aux conteneurs

```bash
# Backend
docker-compose exec backend sh

# Base de données
docker-compose exec postgres psql -U postgres -d meteo_pro
```

## 🏭 Production

Pour déployer en production:

```bash
# 1. Configurer .env.production
cp .env.example .env.production
nano .env.production

# 2. Démarrer en mode production
./docker-start.sh prod

# Ou manuellement:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 📦 Services Inclus

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | Interface React + Nginx |
| Backend | 5001 | API Node.js + Express |
| PostgreSQL | 5432 | Base de données |
| Redis | 6379 | Cache |
| Nginx | 80/443 | Reverse proxy (prod) |

## 🔐 Sécurité

- ✅ Utilisateurs non-root dans conteneurs
- ✅ Volumes persistants séparés
- ✅ Health checks configurés
- ✅ Network isolation
- ✅ Resource limits (production)

## 📚 Documentation Complète

Pour plus de détails, voir [DOCKER-GUIDE.md](./DOCKER-GUIDE.md)

---

**Besoin d'aide?** Consultez les logs: `./docker-start.sh logs`
