#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Yaya Platform — Start Script
# ═══════════════════════════════════════════════════════════════
#
# Self-contained deployment: checks env, inits DBs, starts everything.
#
# Usage:
#   ./start.sh              # Start all services
#   ./start.sh --status     # Show service health and exit
#   ./start.sh --stop       # Cleanly stop everything
#   ./start.sh --no-gpu     # Skip vLLM/whisper (CPU-only mode)
#   ./start.sh --reset-db   # WARNING: Wipes and re-creates all databases
# ═══════════════════════════════════════════════════════════════

set -euo pipefail
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[yaya]${NC} $*"; }
warn() { echo -e "${YELLOW}[yaya]${NC} $*"; }
err()  { echo -e "${RED}[yaya]${NC} $*"; }

# ── Parse flags ──────────────────────────────────────────────

NO_GPU=false
RESET_DB=false
STATUS_ONLY=false
STOP=false

for arg in "$@"; do
  case $arg in
    --no-gpu)   NO_GPU=true ;;
    --reset-db) RESET_DB=true ;;
    --status)   STATUS_ONLY=true ;;
    --stop)     STOP=true ;;
    --help|-h)
      echo "Usage: ./start.sh [--status|--stop|--no-gpu|--reset-db]"
      exit 0 ;;
  esac
done

# ── Health check function ────────────────────────────────────

check_service() {
  local name=$1 check_type=$2 target=$3
  case $check_type in
    http)
      local code
      code=$(curl -sf -o /dev/null -w '%{http_code}' --max-time 3 "$target" 2>/dev/null || true)
      code="${code:-000}"
      if [[ "$code" =~ ^(200|301|302|503)$ ]]; then
        echo -e "  ${GREEN}✓${NC} $name"
        return 0
      elif [ "$code" = "000" ]; then
        echo -e "  ${RED}✗${NC} $name (unreachable)"
        return 1
      else
        echo -e "  ${RED}✗${NC} $name (HTTP $code)"
        return 1
      fi
      ;;
    tcp)
      local host port
      host=$(echo "$target" | cut -d: -f1)
      port=$(echo "$target" | cut -d: -f2)
      if timeout 2 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $name"
        return 0
      else
        echo -e "  ${RED}✗${NC} $name"
        return 1
      fi
      ;;
    docker)
      local health
      health=$(docker inspect --format='{{.State.Health.Status}}' "$target" 2>/dev/null || echo "not found")
      if [ "$health" = "healthy" ]; then
        echo -e "  ${GREEN}✓${NC} $name (healthy)"
        return 0
      elif [ "$health" = "not found" ]; then
        echo -e "  ${RED}✗${NC} $name (not running)"
        return 1
      else
        echo -e "  ${YELLOW}~${NC} $name ($health)"
        return 1
      fi
      ;;
    systemd)
      if systemctl --user is-active "$target" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $name (systemd)"
        return 0
      else
        echo -e "  ${RED}✗${NC} $name (systemd: inactive)"
        return 1
      fi
      ;;
  esac
}

show_status() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Yaya Platform — Service Status${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  Infrastructure:${NC}"

  local fails=0
  check_service "PostgreSQL      :5432" tcp "localhost:5432" || fails=$((fails + 1))
  check_service "Redis           :6379" tcp "localhost:6379" || fails=$((fails + 1))
  check_service "MinIO           :9000" http "http://localhost:9000/minio/health/live" || fails=$((fails + 1))

  echo -e "${BOLD}  AI / ML:${NC}"
  check_service "vLLM (Qwen3.5)  :8000" http "http://localhost:8000/v1/models" || fails=$((fails + 1))
  check_service "Whisper STT     :9300" http "http://localhost:9300/health" || fails=$((fails + 1))
  check_service "Kokoro TTS      :9400" http "http://localhost:9400" || fails=$((fails + 1))

  echo -e "${BOLD}  Application:${NC}"
  check_service "Autobot         :3000" http "http://localhost:3000/api/v1/health" || fails=$((fails + 1))

  echo -e "${BOLD}  Business Services:${NC}"
  check_service "Cal.com         :3002" http "http://localhost:3002" || fails=$((fails + 1))
  check_service "Lago API        :3010" http "http://localhost:3010/api/v1/health" || fails=$((fails + 1))
  check_service "Lago Frontend   :8080" http "http://localhost:8080" || fails=$((fails + 1))
  check_service "Metabase        :3003" http "http://localhost:3003" || fails=$((fails + 1))

  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
  echo -e "  Dashboards:"
  echo -e "    Autobot:  ${CYAN}https://cx.yaya.sh${NC}"
  echo -e "    Cal.com:  ${CYAN}http://localhost:3002${NC}"
  echo -e "    Lago:     ${CYAN}http://localhost:8080${NC}"
  echo -e "    Metabase: ${CYAN}http://localhost:3003${NC}"
  echo -e "    MinIO:    ${CYAN}http://localhost:9001${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════${NC}"

  if [ $fails -gt 0 ]; then
    echo -e "  ${YELLOW}$fails service(s) not healthy${NC}"
  else
    echo -e "  ${GREEN}All services healthy!${NC}"
  fi
  echo ""
}

# ── --status: just show health and exit ──────────────────────

if [ "$STATUS_ONLY" = true ]; then
  show_status
  exit 0
fi

# ── --stop: cleanly shut everything down ─────────────────────

if [ "$STOP" = true ]; then
  log "Stopping Yaya Platform..."

  # Stop autobot (systemd or process)
  if systemctl --user is-active autobot.service &>/dev/null; then
    log "Stopping autobot (systemd)..."
    systemctl --user stop autobot.service
  fi
  # Kill any rogue node autobot process
  pkill -f "node.*dist/index.js" 2>/dev/null || true

  log "Stopping Docker services..."
  docker compose down

  log "All services stopped."
  exit 0
fi

# ── Pre-flight checks ────────────────────────────────────────

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

# ── Environment validation ───────────────────────────────────

# Load .env file
if [ ! -f .env ]; then
  if [ -f autobot/.env ]; then
    log "Symlinking autobot/.env → .env"
    ln -sf autobot/.env .env
  else
    warn "No .env file found. Copy .env.example and configure it."
  fi
fi

# Source .env for variable checks (without exporting to avoid leaking)
if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

# Auto-generate secrets if not set
generate_secret() { openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64; }

ENV_FILE="${ENV_FILE:-.env}"
append_env() {
  local key=$1 val=$2
  if [ -f "$ENV_FILE" ]; then
    echo "$key=$val" >> "$ENV_FILE"
    log "  Auto-generated $key"
  fi
}

if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
  warn "BETTER_AUTH_SECRET not set — generating one..."
  BETTER_AUTH_SECRET=$(generate_secret)
  append_env "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET"
fi

if [ -z "${LAGO_SECRET:-}" ] && [ -z "${SECRET_KEY_BASE:-}" ]; then
  warn "LAGO_SECRET not set — generating one..."
  LAGO_SECRET=$(generate_secret)
  append_env "LAGO_SECRET" "$LAGO_SECRET"
fi

if [ -z "${LAGO_ENC_PRIMARY:-}" ]; then
  warn "LAGO_ENC_PRIMARY not set — generating one..."
  LAGO_ENC_PRIMARY=$(generate_secret)
  append_env "LAGO_ENC_PRIMARY" "$LAGO_ENC_PRIMARY"
fi

if [ -z "${LAGO_ENC_DETERMINISTIC:-}" ]; then
  warn "LAGO_ENC_DETERMINISTIC not set — generating one..."
  LAGO_ENC_DETERMINISTIC=$(generate_secret)
  append_env "LAGO_ENC_DETERMINISTIC" "$LAGO_ENC_DETERMINISTIC"
fi

if [ -z "${LAGO_ENC_SALT:-}" ]; then
  warn "LAGO_ENC_SALT not set — generating one..."
  LAGO_ENC_SALT=$(generate_secret)
  append_env "LAGO_ENC_SALT" "$LAGO_ENC_SALT"
fi

# Warn about critical missing vars
MISSING=()
[ -z "${DATABASE_URL:-}" ] && [ -z "${POSTGRES_PASSWORD:-}" ] && MISSING+=("DATABASE_URL or POSTGRES_PASSWORD")
[ -z "${AI_API_KEY:-}" ] && MISSING+=("AI_API_KEY")
[ -z "${S3_ACCESS_KEY:-}" ] && [ -z "${MINIO_ROOT_USER:-}" ] && MISSING+=("S3_ACCESS_KEY or MINIO_ROOT_USER")

if [ ${#MISSING[@]} -gt 0 ]; then
  warn "Missing environment variables (using defaults may be insecure):"
  for m in "${MISSING[@]}"; do
    warn "  - $m"
  done
fi

# ── Ensure Docker volumes exist ──────────────────────────────

for vol in autobot_pgdata autobot_redisdata autobot_miniodata; do
  if ! docker volume inspect "$vol" &>/dev/null; then
    log "Creating volume: $vol"
    docker volume create "$vol"
  fi
done

# ── Stop old standalone containers ───────────────────────────

OLD_CONTAINERS="vllm-qwen35 whisper-api kokoro-tts calcom lago-api lago-worker lago-front metabase websites"
for c in $OLD_CONTAINERS; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
    log "Stopping old standalone container: $c"
    docker rm -f "$c" 2>/dev/null || true
  fi
done

# ── Compose profiles ─────────────────────────────────────────

COMPOSE_CMD="docker compose"

if [ "$NO_GPU" = true ]; then
  log "GPU services disabled (--no-gpu)"
  GPU_SCALE="--scale vllm=0 --scale whisper=0"
else
  GPU_SCALE=""
fi

# ── Start infrastructure first ───────────────────────────────

log "Starting core infrastructure (postgres, redis, minio)..."
$COMPOSE_CMD up -d postgres redis minio
$COMPOSE_CMD exec -T postgres sh -c 'until pg_isready -U ${POSTGRES_USER:-yaya_prod}; do sleep 1; done' 2>/dev/null

# ── Database initialization (only on first run) ──────────────

NEEDS_SCHEMA=false
DB_EXISTS=$($COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d "${POSTGRES_DB:-yaya}" -tAc "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE tablename='tenants')" 2>/dev/null || echo "f")

if [ "$RESET_DB" = true ]; then
  warn "Resetting ALL databases (--reset-db)..."
  $COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -c "DROP DATABASE IF EXISTS calcom_db; DROP DATABASE IF EXISTS lago_db; DROP DATABASE IF EXISTS metabase_db;" 2>/dev/null || true
  NEEDS_SCHEMA=true
fi

if [ "$DB_EXISTS" != "t" ] || [ "$NEEDS_SCHEMA" = true ]; then
  log "First run detected — initializing databases..."

  # Create service databases
  $COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" << 'DBSQL'
SELECT 'CREATE DATABASE calcom_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'calcom_db')\gexec
SELECT 'CREATE DATABASE lago_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lago_db')\gexec
SELECT 'CREATE DATABASE metabase_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'metabase_db')\gexec
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'calcom') THEN CREATE ROLE calcom WITH LOGIN PASSWORD 'calcom_s3cur3'; END IF; END $$;
GRANT ALL PRIVILEGES ON DATABASE calcom_db TO calcom;
GRANT ALL PRIVILEGES ON DATABASE lago_db TO yaya_prod;
GRANT ALL PRIVILEGES ON DATABASE metabase_db TO yaya_prod;
DBSQL

  # Grant schema permissions
  $COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d calcom_db -c "GRANT ALL ON SCHEMA public TO calcom;" 2>/dev/null || true
  $COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d metabase_db -c "GRANT CREATE ON SCHEMA public TO yaya_prod;" 2>/dev/null || true

  # Apply Yaya schemas in order
  log "Applying Yaya database schemas..."
  $COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d "${POSTGRES_DB:-yaya}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null

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
      $COMPOSE_CMD exec -T postgres psql -U "${POSTGRES_USER:-yaya_prod}" -d "${POSTGRES_DB:-yaya}" < "$schema" 2>/dev/null || warn "  Warning: $schema had errors (may be OK if tables exist)"
    fi
  done

  log "Database initialization complete!"
else
  log "Databases already initialized (tenants table exists)."
fi

# ── Start all services ───────────────────────────────────────

log "Starting all Docker services..."
$COMPOSE_CMD up -d $GPU_SCALE

# ── Start autobot (systemd preferred, npm fallback) ──────────

start_autobot_npm() {
  log "Starting autobot via npm (fallback mode)..."
  cd autobot
  if [ ! -d dist ] || [ ! -f dist/index.js ]; then
    log "Building autobot..."
    npm run build
  fi
  # Start in background, log to file
  nohup node dist/index.js > ../autobot.log 2>&1 &
  local pid=$!
  echo "$pid" > ../autobot.pid
  cd ..
  sleep 2
  if kill -0 "$pid" 2>/dev/null; then
    log "Autobot: running (PID $pid, logs: autobot.log)"
  else
    err "Autobot failed to start. Check autobot.log"
  fi
}

if systemctl --user is-enabled autobot.service &>/dev/null; then
  log "Starting autobot service..."
  systemctl --user restart autobot.service
  sleep 2
  if systemctl --user is-active autobot.service &>/dev/null; then
    log "Autobot: running (systemd)"
  else
    warn "Autobot systemd service failed. Falling back to npm..."
    start_autobot_npm
  fi
elif [ -d autobot ] && [ -f autobot/package.json ]; then
  start_autobot_npm
else
  warn "Autobot not found. Expected at ./autobot/"
fi

# ── Wait for vLLM ────────────────────────────────────────────

if [ "$NO_GPU" = false ]; then
  log "Waiting for vLLM to load model (can take 2-3 minutes)..."
  for i in $(seq 1 60); do
    if curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/v1/models -H "Authorization: Bearer ${AI_API_KEY:-megustalaia}" 2>/dev/null | grep -q 200; then
      log "vLLM: ready (${i}0s)"
      break
    fi
    if [ "$i" -eq 60 ]; then
      warn "vLLM still loading after 10 min. Check: docker compose logs vllm"
    fi
    sleep 10
  done
fi

# ── Show final status ────────────────────────────────────────

show_status
log "Startup complete!"
