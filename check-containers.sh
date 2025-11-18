#!/bin/bash
# Script de diagnostic pour identifier le problème de configuration

echo "🔍 Diagnostic Docker - MeteoProApp"
echo "======================================"
echo ""

echo "📦 Conteneurs en cours d'exécution:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "📊 Images Docker disponibles:"
docker images | grep meteo
echo ""

echo "🔍 Inspection du conteneur frontend:"
if docker ps | grep -q meteo-frontend; then
    echo "   Container ID: $(docker ps -qf 'name=meteo-frontend')"
    echo "   Dockerfile utilisé:"
    docker inspect meteo-frontend | grep -A 5 "Dockerfile" || echo "   (Info non disponible)"
    echo ""
    echo "   Variables d'environnement:"
    docker exec meteo-frontend env | grep -E "VITE_|NODE_ENV" || echo "   (Aucune variable VITE trouvée)"
    echo ""
    echo "   Processus en cours:"
    docker exec meteo-frontend ps aux | head -5
else
    echo "   ⚠️  Conteneur frontend non trouvé"
fi
echo ""

echo "🌐 Services exposés:"
netstat -tlnp 2>/dev/null | grep -E ":(80|443|5173|5001)" || ss -tlnp | grep -E ":(80|443|5173|5001)"
echo ""

echo "📝 Docker Compose actuel:"
docker-compose ps 2>/dev/null || docker compose ps
echo ""
