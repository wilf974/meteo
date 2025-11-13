#!/bin/bash

# 🚀 Script de mise à jour VPS - Météo Pro
# Usage: ./update-vps.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🌤️  Météo Pro - Mise à Jour VPS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${PURPLE}▶ $1${NC}"
}

# Vérifier qu'on est sur le VPS
check_vps() {
    if [ ! -d "/opt/apps/meteo" ]; then
        print_error "Ce script doit être exécuté sur le VPS dans /opt/apps/meteo"
        exit 1
    fi
}

# Backup avant mise à jour
backup_data() {
    print_step "Backup des données..."

    BACKUP_DIR="/opt/backups/meteo/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup analytics
    if docker ps -q -f name=meteo-backend &> /dev/null; then
        docker cp meteo-backend:/app/data/analytics.json "$BACKUP_DIR/analytics.json" 2>/dev/null || true
        print_info "Analytics sauvegardés"
    fi

    # Backup base de données
    if docker ps -q -f name=meteo-postgres &> /dev/null; then
        docker exec meteo-postgres pg_dump -U postgres meteo_pro > "$BACKUP_DIR/database.sql"
        print_info "Base de données sauvegardée"
    fi

    print_success "Backup créé dans $BACKUP_DIR"
}

# Pull dernières modifications
pull_updates() {
    print_step "Récupération des dernières modifications..."

    git fetch origin

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Branche actuelle: $CURRENT_BRANCH"

    git pull origin "$CURRENT_BRANCH"
    print_success "Code mis à jour"
}

# Rebuild et redémarrage des services
rebuild_services() {
    print_step "Rebuild des services Docker..."

    # Arrêter les services
    print_info "Arrêt des services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

    # Rebuild
    print_info "Build des nouvelles images..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

    # Redémarrer
    print_info "Démarrage des services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

    print_success "Services redémarrés"
}

# Vérifier la santé des services
check_health() {
    print_step "Vérification de la santé des services..."

    sleep 10  # Attendre que les services démarrent

    # Backend health check
    if curl -f http://localhost:5001/health &> /dev/null; then
        print_success "Backend opérationnel"
    else
        print_error "Backend non accessible"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend --tail=50
        exit 1
    fi

    # Frontend check
    if curl -f http://localhost:5173/ &> /dev/null; then
        print_success "Frontend opérationnel"
    else
        print_error "Frontend non accessible"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend --tail=50
        exit 1
    fi
}

# Afficher le statut
show_status() {
    print_step "Statut des services:"
    echo ""
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
    echo ""
    print_info "Logs en temps réel: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
}

# Nettoyage
cleanup() {
    print_step "Nettoyage..."
    docker image prune -f
    print_success "Images inutilisées supprimées"
}

# Main
main() {
    print_header
    echo ""

    check_vps

    read -p "⚠️  Continuer avec la mise à jour? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Mise à jour annulée"
        exit 0
    fi

    echo ""
    backup_data
    echo ""
    pull_updates
    echo ""
    rebuild_services
    echo ""
    check_health
    echo ""
    cleanup
    echo ""
    show_status
    echo ""

    print_success "🎉 Mise à jour terminée avec succès!"
    echo ""
    print_info "📱 Application: https://meteoproapp.woutils.com"
    print_info "🔧 API: https://meteoproapp.woutils.com/api/v1"
    print_info "📊 Health: https://meteoproapp.woutils.com/api/v1/health"
    echo ""
}

main
