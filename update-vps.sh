#!/bin/bash

# 🚀 Script de mise à jour VPS - Météo Pro
# Usage: ./update-vps.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🌤️  Météo Pro - Mise à Jour VPS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Git pull
echo -e "${YELLOW}▶ Git pull...${NC}"
git pull origin claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc
echo -e "${GREEN}✓ Code mis à jour${NC}"
echo ""

# 2. Docker compose down
echo -e "${YELLOW}▶ Arrêt des services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
echo -e "${GREEN}✓ Services arrêtés${NC}"
echo ""

# 3. Docker compose up -d --build
echo -e "${YELLOW}▶ Rebuild et démarrage...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
echo -e "${GREEN}✓ Services redémarrés${NC}"
echo ""

# 4. Afficher le statut
echo -e "${YELLOW}▶ Statut des services:${NC}"
echo ""
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎉 Mise à jour terminée!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📱 Application: https://meteoproapp.woutils.com${NC}"
echo -e "${YELLOW}🔧 Logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f${NC}"
echo ""
