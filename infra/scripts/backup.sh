#!/usr/bin/env bash
# Yaya Platform — Backup Script
# Usage: ./infra/scripts/backup.sh [backup_dir]
# Backs up all databases + MinIO data, compresses with timestamp, retains 7 days.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCKER_DIR="$REPO_ROOT/infra/docker"
ENV_FILE="$DOCKER_DIR/.env"
BACKUP_ROOT="${1:-$REPO_ROOT/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
RETENTION_DAYS=7

# ── Colors ────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*" >&2; }
info()  { echo -e "${BLUE}[i]${NC} $*"; }

# ── Load environment ──────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    error ".env not found at $ENV_FILE — run setup.sh first"
    exit 1
fi
set -a
source "$ENV_FILE"
set +a

# ── Create backup directory ───────────────────────────
mkdir -p "$BACKUP_DIR"
info "Backup directory: $BACKUP_DIR"

# ── Get docker compose project prefix ─────────────────
get_container() {
    docker compose -f "$DOCKER_DIR/docker-compose.yml" --env-file "$ENV_FILE" \
        ps -q "$1" 2>/dev/null | head -1
}

# ── Backup PostgreSQL databases ───────────────────────
backup_postgres() {
    local container
    container=$(get_container postgres)
    if [ -z "$container" ]; then
        error "PostgreSQL container not running — skipping database backup"
        return
    fi

    local databases=("${POSTGRES_DB:-yaya}" "${LAGO_DB_NAME:-lago_db}" "crm_db")

    for db in "${databases[@]}"; do
        info "Dumping database: $db"
        if docker exec "$container" pg_dump \
            -U "${POSTGRES_USER:-yaya}" \
            --format=custom \
            --compress=6 \
            "$db" > "$BACKUP_DIR/${db}.dump" 2>/dev/null; then
            local size
            size=$(du -sh "$BACKUP_DIR/${db}.dump" | cut -f1)
            log "$db dumped ($size)"
        else
            warn "Failed to dump $db (may not exist yet)"
            rm -f "$BACKUP_DIR/${db}.dump"
        fi
    done
}

# ── Backup Supabase PostgreSQL ────────────────────────
backup_supabase_db() {
    local container
    container=$(get_container supabase-db)
    if [ -z "$container" ]; then
        warn "Supabase DB container not running — skipping"
        return
    fi

    info "Dumping Supabase CRM database..."
    if docker exec "$container" pg_dump \
        -U "${SUPABASE_DB_USER:-supabase_admin}" \
        --format=custom \
        --compress=6 \
        "${CRM_DB_NAME:-crm_db}" > "$BACKUP_DIR/supabase_crm.dump" 2>/dev/null; then
        local size
        size=$(du -sh "$BACKUP_DIR/supabase_crm.dump" | cut -f1)
        log "Supabase CRM dumped ($size)"
    else
        warn "Failed to dump Supabase CRM database"
        rm -f "$BACKUP_DIR/supabase_crm.dump"
    fi
}

# ── Backup MinIO data ────────────────────────────────
backup_minio() {
    if ! command -v mc &>/dev/null; then
        warn "mc (MinIO Client) not installed — skipping MinIO backup"
        warn "Install: https://min.io/docs/minio/linux/reference/minio-mc.html"
        return
    fi

    info "Backing up MinIO buckets..."

    # Configure mc alias
    mc alias set yaya-backup http://localhost:9000 \
        "${MINIO_ROOT_USER:-yaya_s3}" "${MINIO_ROOT_PASSWORD:-changeme}" \
        --api S3v4 2>/dev/null || {
        warn "Cannot connect to MinIO — skipping"
        return
    }

    mkdir -p "$BACKUP_DIR/minio"

    local buckets
    buckets=$(mc ls yaya-backup/ 2>/dev/null | awk '{print $NF}' | tr -d '/')

    for bucket in $buckets; do
        info "Mirroring bucket: $bucket"
        mc mirror --quiet yaya-backup/"$bucket" "$BACKUP_DIR/minio/$bucket" 2>/dev/null || \
            warn "Failed to mirror bucket: $bucket"
    done

    log "MinIO backup complete"
}

# ── Compress backup ───────────────────────────────────
compress_backup() {
    info "Compressing backup..."
    local archive="$BACKUP_ROOT/yaya_backup_${TIMESTAMP}.tar.gz"
    tar -czf "$archive" -C "$BACKUP_ROOT" "$TIMESTAMP"
    rm -rf "$BACKUP_DIR"

    local size
    size=$(du -sh "$archive" | cut -f1)
    log "Compressed backup: $archive ($size)"
}

# ── Prune old backups ─────────────────────────────────
prune_old_backups() {
    info "Pruning backups older than $RETENTION_DAYS days..."
    local count=0
    while IFS= read -r -d '' old_backup; do
        rm -f "$old_backup"
        count=$((count + 1))
    done < <(find "$BACKUP_ROOT" -name "yaya_backup_*.tar.gz" -mtime +"$RETENTION_DAYS" -print0 2>/dev/null)

    if [ "$count" -gt 0 ]; then
        log "Removed $count old backup(s)"
    else
        log "No old backups to prune"
    fi
}

# ── Summary ───────────────────────────────────────────
print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Backup Complete${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}Location:${NC}  $BACKUP_ROOT"
    echo -e "  ${BLUE}Timestamp:${NC} $TIMESTAMP"
    echo -e "  ${BLUE}Retention:${NC} $RETENTION_DAYS days"
    echo ""

    info "Current backups:"
    ls -lh "$BACKUP_ROOT"/yaya_backup_*.tar.gz 2>/dev/null || echo "  (none)"
    echo ""
}

# ── Main ──────────────────────────────────────────────
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Yaya Platform — Backup              ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
    echo ""

    backup_postgres
    backup_supabase_db
    backup_minio
    compress_backup
    prune_old_backups
    print_summary
}

main "$@"
