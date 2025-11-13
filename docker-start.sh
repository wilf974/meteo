#!/bin/bash

# 🐳 Script de démarrage Docker pour Météo Pro
# Usage: ./docker-start.sh [dev|prod|stop|logs|rebuild]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🌤️  Météo Pro - Docker Manager${NC}"
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

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé!"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé!"
        exit 1
    fi

    print_success "Docker et Docker Compose sont installés"
}

check_env_file() {
    if [ ! -f ".env" ]; then
        print_info "Fichier .env non trouvé, création depuis .env.example..."
        cp .env.example .env
        print_info "⚠️  Veuillez éditer le fichier .env avec vos configurations"
        print_info "Notamment: DATABASE_PASSWORD, REDIS_PASSWORD, SMTP_*"
        echo ""
        read -p "Appuyez sur Entrée quand vous avez configuré .env..."
    fi
}

start_dev() {
    print_header
    check_docker
    check_env_file

    echo ""
    print_info "Démarrage en mode DÉVELOPPEMENT..."
    echo ""

    docker-compose up -d

    echo ""
    print_success "Services démarrés!"
    echo ""
    print_info "📱 Frontend: http://localhost:5173"
    print_info "🔧 Backend API: http://localhost:5001"
    print_info "📊 Health Check: http://localhost:5001/health"
    print_info "🗄️  PostgreSQL: localhost:5432"
    print_info "🔴 Redis: localhost:6379"
    echo ""
    print_info "Voir les logs: docker-compose logs -f"
    print_info "Arrêter: ./docker-start.sh stop"
}

start_prod() {
    print_header
    check_docker

    if [ ! -f ".env.production" ]; then
        print_error "Fichier .env.production non trouvé!"
        print_info "Créez .env.production avec vos configurations de production"
        exit 1
    fi

    echo ""
    print_info "Démarrage en mode PRODUCTION..."
    echo ""

    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

    echo ""
    print_success "Services de production démarrés!"
    echo ""
    print_info "🌐 Application: https://votre-domaine.com"
    print_info "Voir les logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
}

stop_services() {
    print_header
    echo ""
    print_info "Arrêt des services..."

    if docker-compose ps -q &> /dev/null; then
        docker-compose down
        print_success "Services arrêtés"
    else
        print_info "Aucun service en cours d'exécution"
    fi
}

show_logs() {
    print_header
    echo ""
    print_info "Logs en temps réel (Ctrl+C pour quitter)..."
    echo ""
    docker-compose logs -f --tail=50
}

rebuild_services() {
    print_header
    echo ""
    print_info "Rebuild des images Docker..."

    read -p "Service à rebuild (backend/frontend/all): " service

    case $service in
        backend)
            docker-compose build --no-cache backend
            docker-compose up -d backend
            print_success "Backend rebuild et redémarré"
            ;;
        frontend)
            docker-compose build --no-cache frontend
            docker-compose up -d frontend
            print_success "Frontend rebuild et redémarré"
            ;;
        all)
            docker-compose build --no-cache
            docker-compose up -d
            print_success "Tous les services rebuild et redémarrés"
            ;;
        *)
            print_error "Service invalide"
            exit 1
            ;;
    esac
}

show_status() {
    print_header
    echo ""
    print_info "Statut des services:"
    echo ""
    docker-compose ps

    echo ""
    print_info "Utilisation des ressources:"
    echo ""
    docker stats --no-stream
}

show_help() {
    print_header
    echo ""
    echo "Usage: ./docker-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev       Démarrer en mode développement (défaut)"
    echo "  prod      Démarrer en mode production"
    echo "  stop      Arrêter tous les services"
    echo "  logs      Afficher les logs en temps réel"
    echo "  rebuild   Rebuild un service spécifique"
    echo "  status    Afficher le statut et les ressources"
    echo "  help      Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  ./docker-start.sh dev       # Démarrer en dev"
    echo "  ./docker-start.sh logs      # Voir les logs"
    echo "  ./docker-start.sh rebuild   # Rebuild un service"
    echo ""
}

# Main
case "${1:-dev}" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_services
        ;;
    logs)
        show_logs
        ;;
    rebuild)
        rebuild_services
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Commande invalide: $1"
        show_help
        exit 1
        ;;
esac
