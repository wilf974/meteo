# 🚀 Guide de Démarrage Rapide - MeteoProApp

## Installation en 5 Minutes

### Option 1: Docker (Recommandé) 🐳

```bash
# 1. Cloner le repository
git clone <your-repo-url>
cd meteo

# 2. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API (au minimum OPENWEATHER_API_KEY)

# 3. Démarrer tous les services
docker-compose up -d

# 4. Attendre que les services démarrent (30 secondes)
docker-compose logs -f

# 5. Accéder à l'application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### Option 2: Installation Locale 💻

```bash
# 1. Prérequis
# - Node.js 20+
# - PostgreSQL 15+
# - Redis 7+

# 2. Installation
npm install

# 3. Démarrer PostgreSQL et Redis (ou via Docker)
docker-compose up -d postgres redis

# 4. Configuration
cp .env.example .env
# Éditer .env avec vos configurations

# 5. Démarrage
npm run dev
# Cela démarre backend + frontend simultanément
```

## Obtenir les Clés API (Gratuit)

### OpenWeatherMap (Requis)
1. Créer un compte sur https://openweathermap.org/api
2. Générer une clé API gratuite
3. Ajouter dans `.env`: `OPENWEATHER_API_KEY=votre_clé`

### Autres APIs (Optionnel)
- **Meteomatics**: https://www.meteomatics.com/en/sign-up-weather-api-test-account/
- **Tomorrow.io**: https://www.tomorrow.io/weather-api/

## Premier Lancement

### 1. Créer un Compte
- Accéder à http://localhost:5173/register
- Remplir le formulaire d'inscription
- Se connecter automatiquement

### 2. Explorer la Carte
- Vue carte interactive avec France centrée
- Cliquer sur le panneau "Couches météo" (haut-droite)
- Activer/désactiver les couches (température, vent, etc.)
- Cliquer sur la carte pour voir les données météo

### 3. Créer une Alerte
- Aller dans "Alertes" (menu gauche)
- Cliquer "Nouvelle alerte"
- Configurer les conditions et zones

### 4. Personnaliser
- Aller dans "Profil"
- Modifier vos préférences
- Choisir vos couches par défaut

## Commandes Utiles

```bash
# Développement
npm run dev              # Démarre backend + frontend
npm run dev:backend      # Backend seul
npm run dev:frontend     # Frontend seul

# Build
npm run build            # Build backend + frontend
npm run build:backend    # Build backend seul
npm run build:frontend   # Build frontend seul

# Tests
npm test                 # Lance tous les tests

# Docker
npm run docker:up        # Démarre Docker Compose
npm run docker:down      # Arrête Docker Compose
npm run docker:build     # Rebuild les images

# Logs
docker-compose logs -f backend    # Logs backend
docker-compose logs -f frontend   # Logs frontend
docker-compose logs -f postgres   # Logs PostgreSQL
```

## Résolution de Problèmes

### Port déjà utilisé
```bash
# Changer les ports dans .env
PORT=3001              # Backend
VITE_PORT=5174         # Frontend (dans vite.config.ts)
```

### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps

# Redémarrer PostgreSQL
docker-compose restart postgres
```

### Erreur "Cannot GET /api/v1/..."
- Vérifier que le backend est démarré
- Vérifier l'URL dans `VITE_API_URL` (.env)

### Carte ne s'affiche pas
- Vérifier la console navigateur (F12)
- Vérifier que Leaflet CSS est chargé
- Essayer en navigation privée

## Fonctionnalités à Tester

- ✅ Carte interactive avec zoom/pan
- ✅ Activation de différentes couches météo
- ✅ Clic sur carte pour météo actuelle
- ✅ Timeline avec navigation temporelle
- ✅ Création d'alertes personnalisées
- ✅ Tableau de bord avec statistiques
- ✅ Profil utilisateur et préférences
- ✅ Temps réel (WebSocket)

## Prochaines Étapes

1. Consulter [README.md](README.md) pour la documentation complète
2. Voir [TODO.md](TODO.md) pour la roadmap
3. Lire [CONTRIBUTING.md](CONTRIBUTING.md) pour contribuer

## Support

- Issues GitHub: https://github.com/your-repo/issues
- Documentation: Voir README.md
- Email: support@meteoproapp.com

---

**Bon développement! 🌦️**
