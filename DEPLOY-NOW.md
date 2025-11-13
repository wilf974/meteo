# 🚀 Déploiement Immédiat - Météo Pro v2.0

## ⚡ Commandes Rapides pour Mise à Jour VPS

### 🔴 Sur votre VPS (root@srv819544)

```bash
# 1. Aller dans le répertoire
cd /opt/apps/meteo

# 2. Pull les dernières modifications
git pull origin claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc

# 3. Exécuter le script de mise à jour
./update-vps.sh
```

**C'est tout!** Le script fait automatiquement:
- ✅ Backup BDD + Analytics
- ✅ Rebuild Docker
- ✅ Redémarrage services
- ✅ Vérification santé

---

## 📋 Ce qui a été ajouté

### 1. 🌧️ Animations Météo Améliorées

**Vent:**
- Particules animées fluides
- Effet de traînée
- Couleurs dynamiques

**Pluie:**
- Gouttes animées
- Flocons de neige
- Effet réaliste

### 2. 📊 Système Analytics

**Tracking:**
- Chaque connexion enregistrée
- Visiteurs uniques comptés
- Stockage persistant

**Email Quotidien:**
- À: jean.maillot14@gmail.com
- Heure: 20:00 chaque soir
- Contenu: Stats hier + aujourd'hui + 7 jours

### 3. 🐳 Docker Optimisé

**Nouveau:**
- Volume `analytics_data`
- Dossier `/app/data` auto-créé
- Health checks améliorés

---

## 🔍 Vérification Post-Déploiement

### 1. Services en cours
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Tous doivent être "Up (healthy)".

### 2. Backend Health
```bash
curl https://meteoproapp.woutils.com/api/v1/health
```

Doit retourner `{"status":"OK",...}`

### 3. Analytics
```bash
curl https://meteoproapp.woutils.com/api/v1/analytics/today
```

Doit retourner les stats du jour.

### 4. Tester Email
```bash
curl -X POST https://meteoproapp.woutils.com/api/v1/analytics/report \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.maillot14@gmail.com"}'
```

Devrait recevoir un email immédiatement.

---

## 📊 Fichiers Analytics

**Localisation:**
```bash
# Voir le fichier
docker exec meteo-backend cat /app/data/analytics.json

# Copier en local
docker cp meteo-backend:/app/data/analytics.json ./analytics_backup.json
```

---

## 🔧 Configuration SMTP

Le fichier `.env` doit contenir:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jean.maillot14@gmail.com
SMTP_PASSWORD=votre_app_password_gmail
SMTP_FROM_EMAIL=jean.maillot14@gmail.com
SMTP_FROM_NAME=Météo Pro
```

**Important:** Utiliser un "App Password" Gmail, pas le mot de passe principal.

### Créer un App Password Gmail:
1. Aller sur https://myaccount.google.com/security
2. Activer "2-Step Verification"
3. Aller dans "App passwords"
4. Générer un mot de passe pour "Mail"
5. Copier le mot de passe dans SMTP_PASSWORD

---

## 📈 Monitoring

### Logs en temps réel
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Logs backend uniquement
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Chercher les emails dans les logs
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend | grep -i "daily report\|scheduler"
```

### Ressources utilisées
```bash
docker stats
```

---

## 🚨 En Cas de Problème

### Rollback rapide
```bash
cd /opt/apps/meteo
git log --oneline -5  # Voir les derniers commits
git checkout <commit-précédent>
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Redémarrer un service
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Voir les erreurs
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend | grep -i error
```

### Reconstruire complètement
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## ✅ Checklist de Déploiement

- [ ] Git pull réussi
- [ ] Script update-vps.sh exécuté
- [ ] Tous services "Up (healthy)"
- [ ] Health check OK
- [ ] Frontend accessible sur https://meteoproapp.woutils.com
- [ ] Analytics endpoint répond
- [ ] Email de test reçu
- [ ] Logs sans erreurs critiques

---

## 📞 Accès Rapides

- **Application**: https://meteoproapp.woutils.com
- **API**: https://meteoproapp.woutils.com/api/v1
- **Health**: https://meteoproapp.woutils.com/api/v1/health
- **Analytics Today**: https://meteoproapp.woutils.com/api/v1/analytics/today
- **Analytics Yesterday**: https://meteoproapp.woutils.com/api/v1/analytics/yesterday

---

## 🎯 Prochains Steps

1. ✅ Déployer sur VPS
2. ✅ Vérifier que tout fonctionne
3. ⏰ Attendre 20:00 pour recevoir le premier email
4. 📊 Vérifier les analytics le lendemain

---

## 📚 Documentation Complète

- **VPS-UPDATE-GUIDE.md** - Guide détaillé mise à jour
- **DOCKER-GUIDE.md** - Documentation Docker complète
- **CHANGELOG.md** - Liste tous les changements
- **DOCKER-QUICKSTART.md** - Démarrage rapide

---

**Version**: 2.0.0
**Date**: 13 Novembre 2025
**Branche**: claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc

**Support**: Consulter les logs avec `docker-compose logs`
