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

# 1. Arrêter les conteneurs
echo "📦 Arrêt des conteneurs..."
docker-compose down
echo ""

# 2. Supprimer l'ancienne image frontend (force rebuild)
echo "🗑️  Suppression de l'ancienne image frontend..."
docker rmi meteo-frontend 2>/dev/null || echo "   Image frontend déjà supprimée"
echo ""

# 3. Rebuild avec configuration production
echo "🏗️  Rebuild avec configuration PRODUCTION..."
echo "   ⚠️  Ceci peut prendre 2-5 minutes..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build backend
echo ""

# 4. Démarrer en production
echo "🚀 Démarrage en mode production..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo ""

# 5. Attendre le démarrage
echo "⏳ Attente du démarrage (10 secondes)..."
sleep 10
echo ""

# 6. Vérifier le statut
echo "📊 Statut des conteneurs:"
docker-compose ps
echo ""

echo "✅ Rebuild terminé!"
echo ""
echo "🔍 Vérification:"
echo "   1. Ouvrir: https://meteoproapp.woutils.com"
echo "   2. Ouvrir la console navigateur (F12)"
echo "   3. Vérifier: '🔌 Connecting to WebSocket: https://meteoproapp.woutils.com'"
echo ""
echo "📝 Voir les logs frontend:"
echo "   docker-compose logs -f frontend"
echo ""
