#!/bin/bash
# Daily PostgreSQL backup script for Yaya platform
# Runs inside the postgres container via docker exec

set -euo pipefail

BACKUP_DIR="/home/hola/Project/autobot/backups"
CONTAINER_NAME="autobot-postgres-1"
DB_USER="${POSTGRES_USER:-yaya_prod}"
DB_NAME="${POSTGRES_DB:-yaya}"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/yaya_backup_$DATE.sql.gz"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Dump database from running container
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup completed: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Remove backups older than retention period
find "$BACKUP_DIR" -name "yaya_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "yaya_backup_*.sql.gz" | wc -l)
echo "[$(date)] Cleanup done. $REMAINING backups retained."
