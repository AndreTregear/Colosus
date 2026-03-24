#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Yaya Platform — Start Script
# ═══════════════════════════════════════════════════════════════
#
# First run:  Initializes DBs, applies schemas, starts everything
# Later runs: Just starts containers (data preserved in volumes)
#
# Usage:
#   ./start.sh              # Start all services
#   ./start.sh --no-gpu     # Skip vLLM/whisper (CPU-only mode)
#   ./start.sh --reset-db   # WARNING: Wipes and re-creates all databases
# ═══════════════════════════════════════════════════════════════

set -euo pipefail
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[yaya]${NC} $*"; }
warn() { echo -e "${YELLOW}[yaya]${NC} $*"; }
err()  { echo -e "${RED}[yaya]${NC} $*"; }

NO_GPU=false
RESET_DB=false
for arg in "$@"; do
  case $arg in
    --no-gpu) NO_GPU=true ;;
    --reset-db) RESET_DB=true ;;
  esac
done

# ── Pre-flight checks ──────────────────────────────────────────

log "Yaya Platform — Starting up..."

if ! command -v docker &>/dev/null; then
  err "Docker not found. Install: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  err "Docker Compose V2 not found."
  exit 1
fi

if [ "$NO_GPU" = false ]; then
  if ! nvidia-smi &>/dev/null; then
    warn "NVIDIA GPU not detected. Starting without GPU services."
    NO_GPU=true
  fi
fi

# ── Environment ────────────────────────────────────────────────

if [ ! -f .env ]; then
  if [ -f autobot/.env ]; then
    log "Using autobot/.env"
    ln -sf autobot/.env .env
  else
    warn "No .env file found. Using defaults."
  fi
fi

# ── Stop old standalone containers ─────────────────────────────

OLD_CONTAINERS="vllm-qwen35 whisper-api kokoro-tts calcom lago-api lago-worker lago-front metabase websites"
for c in $OLD_CONTAINERS; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
    log "Stopping old standalone container: $c"
    docker rm -f "$c" 2>/dev/null || true
  fi
done

# ── Compose profiles ───────────────────────────────────────────

COMPOSE_CMD="docker compose"
COMPOSE_FILES="-f docker-compose.yml"

if [ "$NO_GPU" = true ]; then
  log "GPU services disabled (--no-gpu)"
  # Scale down GPU services
  GPU_SCALE="--scale vllm=0 --scale whisper=0"
else
  GPU_SCALE=""
fi

# ── Start infrastructure first ─────────────────────────────────

log "Starting core infrastructure (postgres, redis, minio)..."
$COMPOSE_CMD $COMPOSE_FILES up -d postgres redis minio
$COMPOSE_CMD $COMPOSE_FILES exec -T postgres sh -c 'until pg_isready -U ${POSTGRES_USER:-yaya_prod}; do sleep 1; done' 2>/dev/null

# ── Database initialization ────────────────────────────────────

NEEDS_SCHEMA=false
DB_EXISTS=$($COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d "${POSTGRES_DB:-yaya}" -tAc "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE tablename='tenants')" 2>/dev/null || echo "f")

if [ "$RESET_DB" = true ]; then
  warn "Resetting ALL databases (--reset-db)..."
  $COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -c "DROP DATABASE IF EXISTS calcom_db; DROP DATABASE IF EXISTS lago_db; DROP DATABASE IF EXISTS metabase_db;" 2>/dev/null || true
  NEEDS_SCHEMA=true
fi

if [ "$DB_EXISTS" != "t" ] || [ "$NEEDS_SCHEMA" = true ]; then
  log "First run detected — initializing databases..."

  # Create service databases
  $COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" << 'DBSQL'
SELECT 'CREATE DATABASE calcom_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'calcom_db')\gexec
SELECT 'CREATE DATABASE lago_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lago_db')\gexec
SELECT 'CREATE DATABASE metabase_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'metabase_db')\gexec
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'calcom') THEN CREATE ROLE calcom WITH LOGIN PASSWORD 'calcom_s3cur3'; END IF; END $$;
GRANT ALL PRIVILEGES ON DATABASE calcom_db TO calcom;
GRANT ALL PRIVILEGES ON DATABASE lago_db TO yaya_prod;
GRANT ALL PRIVILEGES ON DATABASE metabase_db TO yaya_prod;
DBSQL

  # Grant schema permissions
  $COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d calcom_db -c "GRANT ALL ON SCHEMA public TO calcom;" 2>/dev/null || true
  $COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d metabase_db -c "GRANT CREATE ON SCHEMA public TO yaya_prod;" 2>/dev/null || true

  # Apply Yaya schemas in order
  log "Applying Yaya database schemas..."
  $COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d "${POSTGRES_DB:-yaya}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null

  SCHEMA_FILES=(
    "autobot/schema.sql"
    "autobot/schema-warehouse.sql"
    "autobot/schema-rl.sql"
    "autobot/schema-customer-memories.sql"
    "autobot/schema-subscriptions.sql"
    "autobot/schema-rls.sql"
  )

  for schema in "${SCHEMA_FILES[@]}"; do
    if [ -f "$schema" ]; then
      log "  Applying $schema..."
      $COMPOSE_CMD $COMPOSE_FILES exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d "${POSTGRES_DB:-yaya}" < "$schema" 2>/dev/null || warn "  Warning: $schema had errors (may be OK if tables exist)"
    fi
  done

  log "Database initialization complete!"
else
  log "Databases already initialized."
fi

# ── Start all services ─────────────────────────────────────────

log "Starting all services..."
$COMPOSE_CMD $COMPOSE_FILES up -d $GPU_SCALE

# ── Start autobot (systemd, not Docker) ────────────────────────

if systemctl --user is-enabled autobot.service &>/dev/null; then
  log "Starting autobot service..."
  systemctl --user restart autobot.service
  sleep 2
  if systemctl --user is-active autobot.service &>/dev/null; then
    log "Autobot: running (systemd)"
  else
    warn "Autobot failed to start. Check: journalctl --user -u autobot -n 20"
  fi
else
  warn "Autobot systemd service not found. Start manually: cd autobot && node dist/index.js"
fi

# ── Wait for vLLM ──────────────────────────────────────────────

if [ "$NO_GPU" = false ]; then
  log "Waiting for vLLM to load model (can take 2-3 minutes)..."
  for i in $(seq 1 60); do
    if curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/v1/models -H "Authorization: Bearer ${AI_API_KEY:-megustalaia}" 2>/dev/null | grep -q 200; then
      log "vLLM: ready (${i}0s)"
      break
    fi
    if [ $i -eq 60 ]; then
      warn "vLLM still loading after 10 min. Check: docker compose logs vllm"
    fi
    sleep 10
  done
fi

# ── Health summary ─────────────────────────────────────────────

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Yaya Platform — Service Status${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"

check() {
  local name=$1 url=$2
  if curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null | grep -qE "200|301|302"; then
    echo -e "  ${GREEN}✓${NC} $name"
  else
    echo -e "  ${RED}✗${NC} $name"
  fi
}

check "PostgreSQL     :5432" "http://localhost:5432" 2>/dev/null || echo -e "  ${GREEN}✓${NC} PostgreSQL     :5432 (TCP)"
check "Redis          :6379" "http://localhost:6379" 2>/dev/null || echo -e "  ${GREEN}✓${NC} Redis          :6379 (TCP)"
check "Autobot        :3000" "http://localhost:3000"
check "vLLM (Qwen3.5) :8000" "http://localhost:8000/v1/models"
check "Whisper STT    :9300" "http://localhost:9300/health"
check "Kokoro TTS     :9400" "http://localhost:9400"
check "Cal.com        :3002" "http://localhost:3002"
check "Lago API       :3010" "http://localhost:3010/api/v1/health"
check "Lago Frontend  :8080" "http://localhost:8080"
check "Metabase       :3003" "http://localhost:3003"
check "MinIO          :9000" "http://localhost:9000/minio/health/live"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "  Dashboards:"
echo -e "    Autobot:  ${CYAN}https://cx.yaya.sh${NC}"
echo -e "    Cal.com:  ${CYAN}http://localhost:3002${NC}"
echo -e "    Lago:     ${CYAN}http://localhost:8080${NC}"
echo -e "    Metabase: ${CYAN}http://localhost:3003${NC}"
echo -e "    MinIO:    ${CYAN}http://localhost:9001${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
