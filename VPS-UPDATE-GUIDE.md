# 🔄 Guide de Mise à Jour VPS

Guide complet pour mettre à jour l'application Météo Pro sur votre VPS.

## ⚡ Mise à Jour Rapide (Recommandé)

### Option 1: Script Automatique

```bash
cd /opt/apps/meteo
./update-vps.sh
```

Le script fait automatiquement:
- ✅ Backup des données (analytics + database)
- ✅ Pull des dernières modifications Git
- ✅ Rebuild des images Docker
- ✅ Redémarrage des services
- ✅ Vérification de santé
- ✅ Nettoyage des anciennes images

### Option 2: Manuel

```bash
cd /opt/apps/meteo

# 1. Backup
docker exec meteo-postgres pg_dump -U postgres meteo_pro > backup_$(date +%Y%m%d).sql
docker cp meteo-backend:/app/data/analytics.json analytics_backup_$(date +%Y%m%d).json

# 2. Pull modifications
git pull origin claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc

# 3. Rebuild et redémarrage
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Vérifier
docker-compose ps
curl https://meteoproapp.woutils.com/api/v1/health
```

## 📋 Nouveautés de cette Version

### 🌧️ Améliorations Couches Météo
- Particules de vent animées avec effet de traînée
- Gouttes de pluie et flocons de neige animés
- Animation fluide à 15 FPS optimisée
- Effets visuels réalistes

### 📊 Système Analytics
- Tracking automatique des connexions
- Email quotidien à jean.maillot14@gmail.com (20h)
- Statistiques: hier, aujourd'hui, moyenne 7 jours
- Stockage persistant dans volume Docker
- Nettoyage automatique (>90 jours)

### 🐳 Docker Optimisé
- Volume dédié pour analytics
- Dossier /app/data créé automatiquement
- Health checks améliorés
- .dockerignore pour builds optimisés

## 🔍 Vérifications Post-Mise à Jour

### 1. Services Docker

```bash
docker-compose ps
```

Tous les services doivent être "Up (healthy)":
- ✅ meteo-frontend
- ✅ meteo-backend
- ✅ meteo-postgres
- ✅ meteo-redis
- ✅ meteo-nginx

### 2. Backend Health Check

```bash
curl https://meteoproapp.woutils.com/api/v1/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "timestamp": "2025-11-13T...",
  "environment": "production"
}
```

### 3. Analytics Endpoint

```bash
curl https://meteoproapp.woutils.com/api/v1/analytics/today
```

Devrait retourner les stats du jour.

### 4. Scheduler Emails

```bash
docker-compose logs backend | grep "Schedulers initialized"
```

Devrait afficher: "✅ Schedulers initialized"

### 5. Volumes Persistants

```bash
docker volume ls | grep meteo
```

Doit inclure:
- meteo_analytics_data
- meteo_postgres_data_prod
- meteo_redis_data_prod

## 📊 Tester le Système Analytics

### Vérifier le Tracking

```bash
# Consulter le fichier analytics
docker exec meteo-backend cat /app/data/analytics.json
```

### Envoyer un Email de Test

```bash
curl -X POST https://meteoproapp.woutils.com/api/v1/analytics/report \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.maillot14@gmail.com"}'
```

### Voir les Logs du Scheduler

```bash
docker-compose logs backend | grep "Daily report"
```

## 🚨 Résolution de Problèmes

### Les services ne démarrent pas

```bash
# Voir les logs détaillés
docker-compose logs backend
docker-compose logs frontend

# Redémarrer un service spécifique
docker-compose restart backend
```

### Erreur de base de données

```bash
# Vérifier la connexion
docker-compose exec backend sh
nc -zv postgres 5432

# Recréer la base (⚠️ perte de données)
docker-compose down -v postgres_data_prod
docker-compose up -d
```

### Analytics ne fonctionne pas

```bash
# Vérifier le volume
docker volume inspect meteo_analytics_data

# Vérifier les permissions
docker-compose exec backend ls -la /app/data

# Recréer le fichier si nécessaire
docker-compose exec backend sh -c "echo '{}' > /app/data/analytics.json"
```

### Emails non envoyés

```bash
# Vérifier la config SMTP
docker-compose exec backend env | grep SMTP

# Tester l'envoi
curl -X POST http://localhost:5001/api/v1/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"jean.maillot14@gmail.com"}'

# Voir les logs SMTP
docker-compose logs backend | grep -i "email\|smtp"
```

## 🔄 Rollback (Retour Arrière)

Si la mise à jour pose problème:

```bash
# 1. Revenir à la version précédente
git log --oneline  # Trouver le commit précédent
git checkout <commit-hash-précédent>

# 2. Rebuild
docker-compose down
docker-compose up -d --build

# 3. Restaurer les données si nécessaire
cat backup_20251113.sql | docker-compose exec -T postgres psql -U postgres meteo_pro
```

## 📦 Backups Automatiques

Les backups sont créés dans `/opt/backups/meteo/` avec format:
```
/opt/backups/meteo/YYYYMMDD_HHMMSS/
├── analytics.json
└── database.sql
```

### Nettoyer les anciens backups

```bash
# Garder seulement les 7 derniers jours
find /opt/backups/meteo -type d -mtime +7 -exec rm -rf {} +
```

## 🔐 Sécurité Post-Mise à Jour

### Vérifier les variables d'environnement

```bash
# Vérifier .env (ne doit PAS être committé)
cat /opt/apps/meteo/.env

# S'assurer que les mots de passe sont forts
grep PASSWORD /opt/apps/meteo/.env
```

### Vérifier les ports exposés

```bash
netstat -tlnp | grep -E '(5001|5173|5432|6379)'
```

En production, seuls 80 et 443 devraient être accessibles depuis l'extérieur.

### Vérifier les logs pour erreurs

```bash
docker-compose logs | grep -i "error\|fail\|critical"
```

## 📈 Monitoring Post-Mise à Jour

### Ressources utilisées

```bash
docker stats --no-stream
```

### Espace disque

```bash
df -h
docker system df
```

### Logs en temps réel

```bash
docker-compose logs -f --tail=100
```

## 🎯 Checklist de Mise à Jour

- [ ] Backup créé
- [ ] Code Git à jour
- [ ] Services rebuilds
- [ ] Health check OK
- [ ] Frontend accessible
- [ ] Backend API répond
- [ ] Analytics fonctionne
- [ ] Scheduler initialisé
- [ ] Logs sans erreurs
- [ ] Email de test envoyé

## 📞 Support

Si problème persistant:
1. Consulter les logs: `docker-compose logs`
2. Vérifier DOCKER-GUIDE.md
3. Rollback si nécessaire

---

**Dernière mise à jour**: 13 Novembre 2025
**Version**: 2.0.0 (Analytics + Animations)
