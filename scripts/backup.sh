#!/bin/bash

# Script de sauvegarde de la base de données et des données importantes
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="/var/backups/meteoproapp"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Sauvegarde de MeteoProApp..."

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Sauvegarde de la base de données..."
docker-compose exec -T postgres pg_dump -U postgres meteo_pro_production > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Backup des fichiers de configuration
echo "Sauvegarde des configurations..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env certbot/conf

# Backup des logs (derniers 7 jours)
echo "Sauvegarde des logs..."
find backend/logs -type f -mtime -7 -exec tar -czf $BACKUP_DIR/logs_$DATE.tar.gz {} +

# Nettoyage des vieux backups (garde 30 jours)
echo "Nettoyage des anciens backups..."
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✅ Sauvegarde terminée: $BACKUP_DIR"
echo "Fichiers créés:"
ls -lh $BACKUP_DIR/*$DATE*
