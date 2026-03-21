#!/bin/bash
# PostgreSQL restore script for Yaya platform
set -euo pipefail

BACKUP_DIR="/home/hola/Project/autobot/backups"
CONTAINER_NAME="autobot-postgres-1"
DB_USER="${POSTGRES_USER:-yaya_prod}"
DB_NAME="${POSTGRES_DB:-yaya}"

if [ -z "${1:-}" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/yaya_backup_*.sql.gz 2>/dev/null || echo "  No backups found."
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: File not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will replace the current database '$DB_NAME' with the backup."
read -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "[$(date)] Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "[$(date)] Restore completed."
