# 🌦️ MeteoProApp - Application Météorologique Professionnelle

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Application météorologique fullstack de niveau professionnel avec carte interactive multi-couches, algorithmes d'analyse IA, collaboration en temps réel et système d'alertes intelligentes.

## ✨ Fonctionnalités Principales

### 🗺️ Carte Interactive Avancée
- **Multi-couches sélectionnables**: Pluie, vent, rafales, vagues, pression, température, orages, foudre, pollen, humidité, neige, qualité de l'air
- **Contrôles avancés**: Opacité, ordre des couches, animations temporelles
- **Timeline interactive**: Navigation dans le temps avec lecture automatique
- **Sélection de points**: Informations météo détaillées au clic

### 🤖 Analyse et IA
- Analyse visuelle et graphique automatisée
- Détection automatique d'anomalies météo
- Génération de heatmaps prévisionnelles
- Suggestions IA des points d'intérêt météo
- Support pour modèles personnalisés (numériques, statistiques, IA)

### 👥 Collaboration Temps Réel
- WebSocket pour communication instantanée
- Annotations partagées sur la carte
- Commentaires et dessins collaboratifs
- Curseurs multi-utilisateurs en direct
- Système de rooms/sessions

### 🔔 Système d'Alertes Intelligentes
- Programmation de règles personnalisées
- Critères combinés (AND/OR/NOT)
- Seuils multiples et conditions complexes
- Notifications multi-canaux (Email, Push, SMS)
- Zones géographiques personnalisées
- Historique complet des alertes

### 📊 Tableaux de Bord
- Interface configurable et personnalisable
- Métriques en temps réel
- Graphiques interactifs
- Comparaison de modèles météo
- Export de configurations

### 🌐 API Météo Universelle
- Intégration OpenWeatherMap
- Support Meteomatics
- Compatible Tomorrow.io
- Système de cache intelligent
- Fallback automatique entre sources

## 🛠️ Stack Technique

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js avec TypeScript
- **Base de données**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: TypeORM
- **Temps réel**: Socket.io
- **Jobs**: Bull
- **Logging**: Winston

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **Cartes**: Leaflet + React-Leaflet
- **State**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: TailwindCSS
- **Graphiques**: Recharts
- **Forms**: React Hook Form + Zod

### DevOps
- **Conteneurisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 20 ou supérieur
- Docker et Docker Compose
- PostgreSQL 15 (ou via Docker)
- Redis 7 (ou via Docker)

### Installation Rapide

1. **Cloner le repository**
```bash
git clone https://github.com/your-username/meteo-pro-app.git
cd meteo-pro-app
```

2. **Configuration des variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos clés API et configurations
```

3. **Démarrage avec Docker (Recommandé)**
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

4. **Démarrage en développement (sans Docker)**
```bash
# Installer les dépendances
npm install

# Démarrer PostgreSQL et Redis localement (ou via Docker)
docker-compose up -d postgres redis

# Démarrer le backend
cd backend
npm install
npm run dev

# Dans un autre terminal, démarrer le frontend
cd frontend
npm install
npm run dev
```

5. **Accéder à l'application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/v1

## 📝 Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine du projet:

```env
# Backend
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=meteo_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Weather APIs
OPENWEATHER_API_KEY=your_openweather_key
METEOMATICS_USERNAME=your_meteomatics_username
METEOMATICS_PASSWORD=your_meteomatics_password
TOMORROW_IO_API_KEY=your_tomorrow_io_key

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Mapbox (optionnel)
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Obtenir les Clés API

1. **OpenWeatherMap**: https://openweathermap.org/api
2. **Meteomatics**: https://www.meteomatics.com/
3. **Tomorrow.io**: https://www.tomorrow.io/weather-api/
4. **Mapbox** (optionnel): https://www.mapbox.com/

## 📖 Documentation

### Structure du Projet

```
meteo-pro-app/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── config/         # Configuration (DB, Redis)
│   │   ├── controllers/    # Contrôleurs API
│   │   ├── entities/       # Modèles TypeORM
│   │   ├── middleware/     # Middleware Express
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Logique métier
│   │   └── utils/          # Utilitaires
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── pages/         # Pages
│   │   ├── store/         # State management (Zustand)
│   │   ├── lib/           # API client, Socket.io
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── shared/                # Code partagé (types, etc.)
├── docker-compose.yml     # Configuration Docker
├── TODO.md               # Roadmap détaillée
└── README.md             # Ce fichier
```

### API Endpoints

#### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Rafraîchir le token

#### Météo
- `GET /api/v1/weather/current` - Météo actuelle
- `GET /api/v1/weather/forecast` - Prévisions
- `GET /api/v1/weather/radar/:layer` - Couche radar
- `POST /api/v1/weather/custom-model` - Modèle personnalisé

#### Alertes
- `GET /api/v1/alerts` - Liste des alertes
- `POST /api/v1/alerts` - Créer une alerte
- `PUT /api/v1/alerts/:id` - Modifier une alerte
- `DELETE /api/v1/alerts/:id` - Supprimer une alerte

#### Utilisateur
- `GET /api/v1/users/me` - Profil utilisateur
- `PUT /api/v1/users/me` - Modifier le profil
- `GET /api/v1/users/preferences` - Préférences
- `PUT /api/v1/users/preferences` - Modifier les préférences

### WebSocket Events

#### Côté Client
- `join-room` - Rejoindre une room
- `leave-room` - Quitter une room
- `map-annotation` - Envoyer une annotation
- `cursor-move` - Mouvement du curseur

#### Côté Serveur
- `map-annotation` - Recevoir une annotation
- `cursor-move` - Recevoir un mouvement de curseur

## 🧪 Tests

```bash
# Backend tests
cd backend
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd frontend
npm test
```

## 🚢 Déploiement en Production

### Avec Docker

```bash
# Build les images
docker-compose build

# Démarrer en production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Variables d'Environnement Production

Assurez-vous de configurer:
- `NODE_ENV=production`
- Clés JWT sécurisées
- Mots de passe de base de données forts
- CORS configuré correctement
- HTTPS activé

## 🗺️ Roadmap

Voir [TODO.md](TODO.md) pour la roadmap complète et détaillée.

### Prochaines Étapes
- [ ] Imagerie satellite haute fréquence
- [ ] Intégration stations météo personnelles
- [ ] Export de bulletins (images, GIF, vidéos)
- [ ] Forum et communauté d'experts
- [ ] Application mobile (React Native)
- [ ] Mode offline (PWA)

## 🤝 Contribution

Les contributions sont les bienvenues! Pour contribuer:

1. Forker le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

- **MeteoProApp Team** - *Travail initial*

## 🙏 Remerciements

- OpenWeatherMap pour les données météo
- Leaflet pour la cartographie
- Toute la communauté open source

## 📞 Support

Pour toute question ou support:
- Ouvrir une issue sur GitHub
- Email: support@meteoproapp.com
- Documentation: https://docs.meteoproapp.com

---

**Fait avec ❤️ pour les météorologues professionnels**
