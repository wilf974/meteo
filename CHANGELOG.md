# 📝 Changelog - Météo Pro

Toutes les modifications notables du projet sont documentées dans ce fichier.

## [2.0.0] - 2025-11-13

### 🌧️ Améliorations Majeures - Couches Météo

#### RealWindLayer
- ✨ Ajout de particules animées fluides
- 💨 Effet de traînée (streak effect) réaliste
- 🎨 Couleurs dynamiques basées sur la vitesse
- 🎯 Spawn adaptatif selon l'intensité du vent
- 📍 Flèches statiques semi-transparentes
- ⚡ Limite de 500 particules pour performance

#### RealPrecipitationLayer
- 💧 Gouttes de pluie animées
- ❄️ Flocons de neige avec effet scintillant
- 🌊 Fade out progressif
- 🎯 Spawn basé sur l'intensité
- ⚡ Limite de 400 gouttes pour performance

#### Performance
- 🎬 Animation à 15 FPS (au lieu de 60 FPS)
- 📉 Throttling pour réduire CPU
- 🚀 Gestion optimisée de la mémoire

### 📊 Système Analytics Complet

#### Backend
- 📈 Service `analytics.service.ts` créé
  - Enregistrement connexions par jour
  - Tracking visiteurs uniques (IP-based)
  - Stockage JSON persistant
  - Statistiques: aujourd'hui, hier, plage dates
  - Nettoyage auto >90 jours

- 🔌 API REST `/api/v1/analytics/`
  - `POST /track` - Enregistrer connexion
  - `GET /today` - Stats du jour
  - `GET /yesterday` - Stats d'hier
  - `GET /range` - Stats période
  - `POST /report` - Envoi manuel rapport

#### Frontend
- 🎣 Hook `useAnalytics` pour tracking auto
- 📡 Une requête par session
- 🔗 Intégré dans App.tsx

### 📧 Rapports Quotidiens Email

- 📅 Destinataire: jean.maillot14@gmail.com
- ⏰ Horaire: 20:00 chaque soir (Europe/Paris)
- 📊 Contenu:
  - Stats d'hier (visiteurs + connexions)
  - Stats du jour
  - Moyenne 7 derniers jours
  - Design HTML professionnel

#### Scheduler
- ⏲️ node-cron pour tâches planifiées
- 🌙 Rapport quotidien: `0 20 * * *`
- 🧹 Nettoyage données: `0 2 * * 0` (Dimanche)
- 🌍 Timezone: Europe/Paris

### 🐳 Configuration Docker

#### Améliorations
- 📦 Volume `analytics_data` ajouté
- 📁 Dossier `/app/data` créé automatiquement
- 📋 `.dockerignore` pour builds optimisés
- 🏥 Health checks améliorés

#### Nouveaux Fichiers
- `DOCKER-GUIDE.md` - Documentation complète
- `DOCKER-QUICKSTART.md` - Démarrage 5 minutes
- `docker-start.sh` - Gestionnaire interactif
- `backend/.dockerignore` - Optimisation
- `frontend/.dockerignore` - Optimisation

### 🚀 Déploiement VPS

- `update-vps.sh` - Script mise à jour automatique
- `VPS-UPDATE-GUIDE.md` - Guide complet
- Backup automatique avant MAJ
- Health checks post-déploiement

### 🛠️ Fichiers Modifiés

**Backend:**
- `src/services/analytics.service.ts` (CRÉÉ)
- `src/controllers/analytics.controller.ts` (CRÉÉ)
- `src/routes/analytics.routes.ts` (CRÉÉ)
- `src/schedulers/daily-report.scheduler.ts` (CRÉÉ)
- `src/routes/index.ts` (MODIFIÉ)
- `src/index.ts` (MODIFIÉ)
- `package.json` (MODIFIÉ - ajout node-cron)

**Frontend:**
- `src/components/map/RealWindLayer.tsx` (MODIFIÉ)
- `src/components/map/RealPrecipitationLayer.tsx` (MODIFIÉ)
- `src/hooks/useAnalytics.ts` (CRÉÉ)
- `src/App.tsx` (MODIFIÉ)

**Docker:**
- `docker-compose.prod.yml` (MODIFIÉ)
- `backend/Dockerfile.prod` (MODIFIÉ)

**Documentation:**
- `DOCKER-GUIDE.md` (CRÉÉ)
- `DOCKER-QUICKSTART.md` (CRÉÉ)
- `VPS-UPDATE-GUIDE.md` (CRÉÉ)
- `CHANGELOG.md` (CRÉÉ)

### 🐛 Corrections

- ⏰ Horloge temps réel en haut à droite retirée (doublon)
- 🕐 Horloge intégrée au Timeline avec MAJ seconde
- 🖱️ Propagation clic FavoritesPanel vers carte corrigée
- 🖱️ Propagation clic marqueurs favoris corrigée
- 🔧 Contrôles alertes ajoutés au Dashboard

### 📦 Dépendances Ajoutées

**Backend:**
- `node-cron@3.0.3`
- `@types/node-cron@3.0.11`

**Frontend:**
- Aucune nouvelle dépendance

### ⚙️ Configuration Requise

**Variables d'environnement (Backend):**
```env
# Analytics & Scheduler (automatique)
NODE_ENV=production

# Email quotidien
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=votre_app_password
SMTP_FROM_EMAIL=votre.email@gmail.com
```

### 🔄 Migration

Aucune migration de base de données requise.

Les données analytics sont stockées dans un nouveau volume Docker qui sera créé automatiquement au premier démarrage.

### 📊 Statistiques du Release

- **12 fichiers** créés
- **7 fichiers** modifiés
- **803+ lignes** ajoutées (premier commit)
- **871+ lignes** ajoutées (config Docker)
- **2 commits** de features majeures

### 🎯 Performance

- Build frontend: 637 KB (gzip: 195 KB)
- Build backend: Compilation TypeScript réussie
- Animations: 15 FPS optimisé
- Memory: Limites configurées en production
  - Backend: 1GB max
  - Frontend: 512MB max
  - Nginx: 256MB max

---

## [1.0.0] - 2025-11-10

### Initial Release

- 🗺️ Interface carte interactive avec Leaflet
- 🌡️ Couches météo (température, vent, précipitations)
- ⭐ Système de favoris
- 📊 Dashboard avec graphiques
- 🔔 Système d'alertes météo
- 👤 Page profil/paramètres
- 🎨 Thème clair/sombre
- 🐳 Configuration Docker complète
- 📱 PWA support

---

## Format

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Types de changements

- **Added** (Ajouté) pour les nouvelles fonctionnalités
- **Changed** (Modifié) pour les changements aux fonctionnalités existantes
- **Deprecated** (Déprécié) pour les fonctionnalités bientôt supprimées
- **Removed** (Retiré) pour les fonctionnalités supprimées
- **Fixed** (Corrigé) pour les corrections de bugs
- **Security** (Sécurité) pour les vulnérabilités

---

**Mainteneur**: @wilf974
**Repository**: wilf974/meteo
**License**: MIT
