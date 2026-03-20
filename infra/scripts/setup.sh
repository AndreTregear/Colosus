#!/usr/bin/env bash
# Yaya Platform — Full Setup Script
# Usage: ./infra/scripts/setup.sh
# Run from the repository root: yaya_platform/
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCKER_DIR="$REPO_ROOT/infra/docker"
ENV_FILE="$DOCKER_DIR/.env"
ENV_EXAMPLE="$DOCKER_DIR/.env.example"

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

# ── Prerequisite Checks ──────────────────────────────
check_prerequisites() {
    local missing=0

    info "Checking prerequisites..."

    if ! command -v docker &>/dev/null; then
        error "docker not found. Install: https://docs.docker.com/engine/install/"
        missing=1
    else
        log "docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
    fi

    if ! docker compose version &>/dev/null; then
        error "docker compose plugin not found. Install: https://docs.docker.com/compose/install/"
        missing=1
    else
        log "docker compose $(docker compose version --short)"
    fi

    if ! command -v nvidia-smi &>/dev/null; then
        warn "nvidia-smi not found — GPU services (vLLM, Whisper) will not work"
    else
        local gpu_count
        gpu_count=$(nvidia-smi -L 2>/dev/null | wc -l)
        log "NVIDIA GPU detected: $gpu_count device(s)"
        if [ "$gpu_count" -lt 2 ]; then
            warn "vLLM tensor-parallel-size=2 requires at least 2 GPUs"
        fi
    fi

    if ! command -v git &>/dev/null; then
        error "git not found"
        missing=1
    else
        log "git $(git --version | awk '{print $3}')"
    fi

    if [ "$missing" -eq 1 ]; then
        error "Missing prerequisites. Install them and retry."
        exit 1
    fi
}

# ── Generate a random secret ─────────────────────────
gen_secret() {
    openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | xxd -p | tr -d '\n'
}

# ── Environment Setup ────────────────────────────────
setup_env() {
    if [ -f "$ENV_FILE" ]; then
        warn ".env already exists at $ENV_FILE — preserving it"
        info "To regenerate, delete the file and re-run setup"
        return
    fi

    info "Creating .env from .env.example..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"

    # Generate secrets
    local pg_pass lago_secret lago_enc_primary lago_enc_det lago_enc_salt
    local supabase_jwt supabase_realtime better_auth minio_pass supabase_db_pass
    local lago_api_key llm_api_key

    pg_pass=$(gen_secret 16)
    minio_pass=$(gen_secret 16)
    lago_secret=$(gen_secret 32)
    lago_enc_primary=$(gen_secret 16)
    lago_enc_det=$(gen_secret 16)
    lago_enc_salt=$(gen_secret 16)
    lago_api_key=$(gen_secret 24)
    supabase_jwt=$(gen_secret 32)
    supabase_realtime=$(gen_secret 32)
    supabase_db_pass=$(gen_secret 16)
    better_auth=$(gen_secret 32)
    llm_api_key=$(gen_secret 16)

    # Replace placeholder values in .env
    sed -i "s|^POSTGRES_PASSWORD=changeme|POSTGRES_PASSWORD=$pg_pass|" "$ENV_FILE"
    sed -i "s|^MINIO_ROOT_PASSWORD=changeme|MINIO_ROOT_PASSWORD=$minio_pass|" "$ENV_FILE"
    sed -i "s|^LAGO_SECRET_KEY_BASE=changeme_generate_with_setup_sh|LAGO_SECRET_KEY_BASE=$lago_secret|" "$ENV_FILE"
    sed -i "s|^LAGO_ENCRYPTION_PRIMARY_KEY=changeme|LAGO_ENCRYPTION_PRIMARY_KEY=$lago_enc_primary|" "$ENV_FILE"
    sed -i "s|^LAGO_ENCRYPTION_DETERMINISTIC_KEY=changeme|LAGO_ENCRYPTION_DETERMINISTIC_KEY=$lago_enc_det|" "$ENV_FILE"
    sed -i "s|^LAGO_ENCRYPTION_KEY_DERIVATION_SALT=changeme|LAGO_ENCRYPTION_KEY_DERIVATION_SALT=$lago_enc_salt|" "$ENV_FILE"
    sed -i "s|^LAGO_API_KEY=|LAGO_API_KEY=$lago_api_key|" "$ENV_FILE"
    sed -i "s|^SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters|SUPABASE_JWT_SECRET=$supabase_jwt|" "$ENV_FILE"
    sed -i "s|^SUPABASE_REALTIME_SECRET=changeme_at_least_64_characters_long_for_production_use_please|SUPABASE_REALTIME_SECRET=$supabase_realtime|" "$ENV_FILE"
    sed -i "s|^SUPABASE_DB_PASSWORD=changeme|SUPABASE_DB_PASSWORD=$supabase_db_pass|" "$ENV_FILE"
    sed -i "s|^BETTER_AUTH_SECRET=changeme|BETTER_AUTH_SECRET=$better_auth|" "$ENV_FILE"
    sed -i "s|^LLM_API_KEY=megustalaia|LLM_API_KEY=$llm_api_key|" "$ENV_FILE"

    log "Generated secrets and wrote to $ENV_FILE"
    warn "Review $ENV_FILE and customize BUSINESS_NAME, YAPE_NUMBER, etc."
}

# ── Initialize Git Submodules ─────────────────────────
init_submodules() {
    info "Initializing git submodules..."
    cd "$REPO_ROOT"
    git submodule update --init --recursive 2>/dev/null || warn "Some submodules failed — check network connectivity"
    log "Git submodules initialized"
}

# ── Build & Pull Images ──────────────────────────────
build_images() {
    info "Pulling and building Docker images..."
    cd "$DOCKER_DIR"
    docker compose --env-file "$ENV_FILE" pull --ignore-pull-failures 2>/dev/null || true
    docker compose --env-file "$ENV_FILE" build --parallel 2>/dev/null || docker compose --env-file "$ENV_FILE" build
    log "Docker images ready"
}

# ── Start Services ────────────────────────────────────
start_services() {
    info "Starting all services..."
    cd "$DOCKER_DIR"
    docker compose --env-file "$ENV_FILE" up -d
    log "Services starting"
}

# ── Wait for Health Checks ────────────────────────────
wait_for_health() {
    info "Waiting for services to become healthy..."
    local timeout=300
    local interval=5
    local elapsed=0

    local services=("postgres" "redis" "minio" "lago-api" "supabase-db" "supabase-rest")

    for svc in "${services[@]}"; do
        elapsed=0
        while [ $elapsed -lt $timeout ]; do
            local health
            health=$(docker compose --env-file "$ENV_FILE" -f "$DOCKER_DIR/docker-compose.yml" \
                ps --format json "$svc" 2>/dev/null | grep -o '"Health":"[^"]*"' | head -1 || echo "")

            if echo "$health" | grep -q "healthy"; then
                log "$svc is healthy"
                break
            fi

            sleep $interval
            elapsed=$((elapsed + interval))
        done

        if [ $elapsed -ge $timeout ]; then
            warn "$svc did not become healthy within ${timeout}s"
        fi
    done

    # vLLM takes longer due to model loading
    info "Waiting for vLLM (model loading may take several minutes)..."
    elapsed=0
    local vllm_timeout=600
    while [ $elapsed -lt $vllm_timeout ]; do
        if curl -sf http://localhost:8000/health &>/dev/null; then
            log "vLLM is healthy"
            break
        fi
        sleep 10
        elapsed=$((elapsed + 10))
    done
    if [ $elapsed -ge $vllm_timeout ]; then
        warn "vLLM did not become healthy within ${vllm_timeout}s — check GPU and model path"
    fi
}

# ── Create MinIO Buckets ─────────────────────────────
setup_minio_buckets() {
    info "Creating MinIO buckets..."
    # Wait for MinIO to be reachable
    local retries=10
    while [ $retries -gt 0 ]; do
        if curl -sf http://localhost:9000/minio/health/live &>/dev/null; then
            break
        fi
        sleep 3
        retries=$((retries - 1))
    done

    if command -v mc &>/dev/null; then
        source "$ENV_FILE" 2>/dev/null || true
        mc alias set yaya http://localhost:9000 "${MINIO_ROOT_USER:-yaya_s3}" "${MINIO_ROOT_PASSWORD:-changeme}" 2>/dev/null || true
        mc mb --ignore-existing yaya/lago 2>/dev/null || true
        mc mb --ignore-existing yaya/media 2>/dev/null || true
        mc mb --ignore-existing yaya/backups 2>/dev/null || true
        log "MinIO buckets created (lago, media, backups)"
    else
        warn "mc (MinIO Client) not found — create buckets manually via http://localhost:9001"
    fi
}

# ── Print Status Summary ─────────────────────────────
print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Yaya Platform — Setup Complete${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}Service              URL${NC}"
    echo -e "  ─────────────────── ─────────────────────────────"
    echo -e "  vLLM (OpenAI API)   http://localhost:8000"
    echo -e "  Whisper API         http://localhost:9100"
    echo -e "  Lago API            http://localhost:3001"
    echo -e "  Lago UI             http://localhost:8080"
    echo -e "  Supabase REST API   http://localhost:54321"
    echo -e "  Supabase Studio     http://localhost:54323"
    echo -e "  PostgreSQL          localhost:5432"
    echo -e "  Redis               localhost:6379"
    echo -e "  MinIO API           http://localhost:9000"
    echo -e "  MinIO Console       http://localhost:9001"
    echo ""
    echo -e "  ${YELLOW}Configuration:${NC} $ENV_FILE"
    echo -e "  ${YELLOW}Logs:${NC}          cd $DOCKER_DIR && docker compose logs -f"
    echo -e "  ${YELLOW}Stop:${NC}          cd $DOCKER_DIR && docker compose down"
    echo ""

    # Show running containers
    cd "$DOCKER_DIR"
    info "Container status:"
    docker compose --env-file "$ENV_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
        docker compose --env-file "$ENV_FILE" ps
    echo ""
}

# ── Main ──────────────────────────────────────────────
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Yaya Platform — Setup               ║${NC}"
    echo -e "${BLUE}║   c.yaya.sh                           ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    setup_env
    init_submodules
    build_images
    start_services
    wait_for_health
    setup_minio_buckets
    print_summary
}

main "$@"
