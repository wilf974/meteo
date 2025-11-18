#!/bin/bash
# Script de rebuild production pour MeteoProApp
# Corrige le problème de Mixed Content en utilisant les bonnes URLs HTTPS

set -e  # Arrêter en cas d'erreur

echo "🔄 Rebuild Production - MeteoProApp"
echo "======================================"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.yml" ] || [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ ERREUR: Ce script doit être exécuté depuis /opt/apps/meteo"
    echo "   Répertoire actuel: $(pwd)"
    exit 1
fi

echo "✅ Répertoire correct: $(pwd)"
echo ""

# 1. Arrêter TOUS les conteneurs (y compris ceux du profil production)
echo "📦 Arrêt des conteneurs..."
docker-compose --profile production down
docker-compose down
echo ""

# 2. Supprimer les anciennes images (force rebuild complet)
echo "🗑️  Suppression des anciennes images..."
docker rmi meteo-frontend meteo-backend 2>/dev/null || echo "   Images déjà supprimées"
echo ""

# 3. Rebuild avec configuration production
echo "🏗️  Rebuild avec configuration PRODUCTION..."
echo "   ⚠️  Ceci peut prendre 2-5 minutes..."
echo ""
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
echo ""

# 4. Démarrer en production AVEC le profil production pour nginx
echo "🚀 Démarrage en mode production (avec nginx)..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
echo ""

# 5. Attendre le démarrage
echo "⏳ Attente du démarrage (15 secondes)..."
sleep 15
echo ""

# 6. Vérifier le statut
echo "📊 Statut des conteneurs:"
docker-compose --profile production ps
echo ""

# 7. Vérification rapide du frontend
echo "🔍 Vérification du build frontend:"
if docker exec meteo-frontend test -f /usr/share/nginx/html/index.html 2>/dev/null; then
    echo "   ✅ Frontend = Build production (Nginx)"
else
    echo "   ⚠️  Frontend = Mode développement (Vite)"
fi
echo ""

echo "✅ Rebuild terminé!"
echo ""
echo "🔍 Vérification dans le navigateur:"
echo "   1. Ouvrir: https://meteoproapp.woutils.com"
echo "   2. Ouvrir la console navigateur (F12)"
echo "   3. Vérifier: '🔌 Connecting to WebSocket: https://meteoproapp.woutils.com'"
echo "   4. NE DOIT PAS afficher: '[vite] connecting...'"
echo ""
echo "📝 Commandes utiles:"
echo "   Logs frontend:  docker-compose logs -f frontend"
echo "   Logs backend:   docker-compose logs -f backend"
echo "   Logs nginx:     docker-compose logs -f nginx"
echo "   Diagnostic:     ./check-containers.sh"
echo ""
