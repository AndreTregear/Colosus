#!/usr/bin/env bash
set -euo pipefail

# ═════════════════════════════════════════════════════════════════════════════
# Yaya Commerce Platform - Startup Script
# Starts: Autobot Backend (Postgres, Redis, MinIO, App)
# ═════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

AUTOBOT_DIR="${SCRIPT_DIR}/autobot"
YAYA_DIR="${SCRIPT_DIR}/Yaya"
AUTOBOT_PORT="${AUTOBOT_PORT:-3000}"

# ═════════════════════════════════════════════════════════════════════════════
# Utility Functions
# ═════════════════════════════════════════════════════════════════════════════

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "${CYAN}${BOLD}>>>${NC} ${BOLD}$1${NC}"; }

print_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   ██╗   ██╗ █████╗ ██╗   ██╗ █████╗                        ║
    ║   ╚██╗ ██╔╝██╔══██╗╚██╗ ██╔╝██╔══██╗                       ║
    ║    ╚████╔╝ ███████║ ╚████╔╝ ███████║                       ║
    ║     ╚██╔╝  ██╔══██║  ╚██╔╝  ██╔══██║                       ║
    ║      ██║   ██║  ██║   ██║   ██║  ██║                       ║
    ║      ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝                       ║
    ║                                                              ║
    ║              Commerce Platform Launcher                      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

wait_for_docker_health() {
    local service="$1"
    local compose_dir="$2"
    local timeout="${3:-120}"

    log_info "Waiting for $service to be healthy..."
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        local status
        status=$(docker compose -f "${compose_dir}/docker-compose.yml" ps "$service" --format json 2>/dev/null | grep -o '"Health":"[^"]*"' | cut -d'"' -f4 || echo "")

        if [ "$status" = "healthy" ]; then
            log_success "$service is healthy"
            return 0
        fi

        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo
    log_warn "$service health check timed out, but it may still be starting"
    return 0
}

# ═════════════════════════════════════════════════════════════════════════════
# Phase 1: Validate Environment
# ═════════════════════════════════════════════════════════════════════════════

validate_environment() {
    log_step "Phase 1: Validating Environment"

    if ! command -v docker &>/dev/null; then
        log_error "Docker is not installed. https://docs.docker.com/get-docker/"
        exit 1
    fi

    if docker compose version &>/dev/null; then
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose &>/dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        log_error "Docker Compose not found"
        exit 1
    fi

    if [ ! -d "$AUTOBOT_DIR" ]; then
        log_error "Autobot directory not found at $AUTOBOT_DIR"
        exit 1
    fi

    log_success "Docker and project structure validated"
}

# ═════════════════════════════════════════════════════════════════════════════
# Phase 2: Setup Environment
# ═════════════════════════════════════════════════════════════════════════════

setup_environment() {
    log_step "Phase 2: Setting up Environment"

    local env_file="${AUTOBOT_DIR}/.env"
    local env_example="${AUTOBOT_DIR}/.env.example"

    if [ ! -f "$env_file" ]; then
        if [ -f "$env_example" ]; then
            cp "$env_example" "$env_file"
            log_info "Created .env from example"
        else
            touch "$env_file"
        fi
    fi

    # Generate BETTER_AUTH_SECRET if not set
    if ! grep -q "^BETTER_AUTH_SECRET=" "$env_file" 2>/dev/null || [ -z "$(grep "^BETTER_AUTH_SECRET=" "$env_file" | cut -d'=' -f2)" ]; then
        local secret
        secret=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        sed -i '/^BETTER_AUTH_SECRET=/d' "$env_file" 2>/dev/null || true
        echo "BETTER_AUTH_SECRET=$secret" >> "$env_file"
        log_success "Generated BETTER_AUTH_SECRET"
    fi

    # Prompt for admin credentials on first run
    if ! grep -q "^ADMIN_EMAIL=" "$env_file" 2>/dev/null || [ -z "$(grep "^ADMIN_EMAIL=" "$env_file" | cut -d'=' -f2 | tr -d ' ')" ]; then
        echo ""
        echo -e "${CYAN}First-time Setup: Create Admin Account${NC}"
        echo -e "${YELLOW}Press Enter to use demo credentials (admin@example.com / changeme)${NC}"
        echo ""

        local admin_email admin_pass admin_name
        read -rp "  Admin email [admin@example.com]: " admin_email
        admin_email="${admin_email:-admin@example.com}"

        read -rsp "  Admin password [changeme]: " admin_pass
        echo ""
        admin_pass="${admin_pass:-changeme}"

        read -rp "  Admin name [Admin]: " admin_name
        admin_name="${admin_name:-Admin}"

        sed -i '/^ADMIN_EMAIL=/d' "$env_file" 2>/dev/null || true
        sed -i '/^ADMIN_PASSWORD=/d' "$env_file" 2>/dev/null || true
        sed -i '/^ADMIN_NAME=/d' "$env_file" 2>/dev/null || true

        {
            echo "ADMIN_EMAIL=$admin_email"
            echo "ADMIN_PASSWORD=$admin_pass"
            echo "ADMIN_NAME=$admin_name"
        } >> "$env_file"

        log_success "Admin credentials configured"
    else
        local existing_email
        existing_email=$(grep "^ADMIN_EMAIL=" "$env_file" | cut -d'=' -f2)
        log_info "Using existing admin: $existing_email"
    fi

    # Check AI API key
    local ai_key
    ai_key=$(grep "^AI_API_KEY=" "$env_file" 2>/dev/null | cut -d'=' -f2 | tr -d ' ' || echo "")
    if [ -z "$ai_key" ] || [ "$ai_key" = "sk-your-deepseek-api-key" ]; then
        echo ""
        echo -e "${YELLOW}AI API Key not configured${NC}"
        echo "  The chatbot needs a valid API key to reply."
        echo "  Get one from: https://platform.deepseek.com/"
        echo ""

        read -rp "  Enter DeepSeek API key (or press Enter to skip): " api_key

        if [ -n "$api_key" ]; then
            sed -i '/^AI_API_KEY=/d' "$env_file" 2>/dev/null || true
            echo "AI_API_KEY=$api_key" >> "$env_file"
            log_success "AI API key configured"
        else
            log_warn "Chatbot will not work without an API key"
        fi
    fi

    # Set port
    if ! grep -q "^PORT=" "$env_file" 2>/dev/null; then
        echo "PORT=${AUTOBOT_PORT}" >> "$env_file"
    fi

    log_success "Environment ready"
}

# ═════════════════════════════════════════════════════════════════════════════
# Phase 3: Start Autobot Backend
# ═════════════════════════════════════════════════════════════════════════════

start_autobot() {
    log_step "Phase 3: Starting Autobot Backend"

    cd "$AUTOBOT_DIR"

    # Export env vars for docker compose interpolation
    if [ -r ".env" ]; then
        set -a
        source .env
        set +a
    fi

    log_info "Building and starting services..."
    if ! $DOCKER_COMPOSE up -d --build; then
        log_error "Failed to start services"
        log_info "Check logs: cd $AUTOBOT_DIR && docker compose logs"
        exit 1
    fi

    # Wait for infrastructure services
    wait_for_docker_health "postgres" "$AUTOBOT_DIR" 120
    wait_for_docker_health "redis" "$AUTOBOT_DIR" 60
    wait_for_docker_health "minio" "$AUTOBOT_DIR" 60

    # Wait for app (schema is applied automatically on startup)
    wait_for_docker_health "app" "$AUTOBOT_DIR" 180

    log_success "Autobot backend running on port ${AUTOBOT_PORT}"
    log_info "Production:  https://yaya.sh  (Caddy provides automatic SSL)"
    log_info "Dev/Direct:  http://localhost:${AUTOBOT_PORT}"
    log_info "Admin:       http://localhost:${AUTOBOT_PORT}/admin"
    log_info "Customer:    http://localhost:${AUTOBOT_PORT}/customer"
}

# ═════════════════════════════════════════════════════════════════════════════
# Phase 4: Android Client (Optional)
# ═════════════════════════════════════════════════════════════════════════════

build_android_client() {
    log_step "Phase 4: Android Client"

    if [ ! -d "$YAYA_DIR" ]; then
        log_warn "Yaya Android directory not found"
        return 0
    fi

    if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
        log_warn "Android SDK not found. Skipping build."
        log_info "To build manually: cd Yaya && ./gradlew assembleDebug"
        return 0
    fi

    echo ""
    echo "  Build options:"
    echo "    1) Build APK only"
    echo "    2) Deploy to connected device"
    echo "    3) Skip"
    echo ""

    local choice
    read -rp "  Select option [3]: " choice
    choice="${choice:-3}"

    case "$choice" in
        1)
            log_info "Building Yaya APK..."
            cd "$YAYA_DIR"
            if ./gradlew assembleDebug; then
                local apk_path="${YAYA_DIR}/app/build/outputs/apk/debug/app-debug.apk"
                if [ -f "$apk_path" ]; then
                    log_success "APK built: $apk_path"
                fi
            else
                log_error "APK build failed"
            fi
            ;;
        2)
            log_info "Deploying to connected device..."
            cd "$YAYA_DIR"
            ./gradlew installDebug
            log_success "App deployed to device"
            ;;
        *)
            log_info "Skipping Android build"
            ;;
    esac
}

# ═════════════════════════════════════════════════════════════════════════════
# Status Dashboard
# ═════════════════════════════════════════════════════════════════════════════

show_status() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}               ${BOLD}Yaya Commerce Platform Ready!${NC}                   ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Access URLs:${NC}"
    echo "  Production (SSL)   https://yaya.sh          (Caddy provides automatic SSL)"
    echo "  Dev / Direct       http://localhost:${AUTOBOT_PORT}"
    echo "  Admin Portal       http://localhost:${AUTOBOT_PORT}/admin"
    echo "  Customer Dashboard http://localhost:${AUTOBOT_PORT}/customer"
    echo ""
    echo -e "${BOLD}API Endpoints:${NC}"
    echo "  Lead Capture (POST)  /api/website/leads"
    echo "  Lead List   (GET)    /api/website/leads"
    echo "  Health Check         /api/v1/health"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo "  ./stop.sh          Stop all services"
    echo "  ./logs.sh          View all logs"
    echo "  ./logs.sh app      View app logs only"
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo "  1. Visit https://yaya.sh (or http://localhost:${AUTOBOT_PORT}) to see your website"
    echo "  2. Open http://localhost:${AUTOBOT_PORT}/admin to manage leads"
    echo "  3. Configure WhatsApp bot and go live"
    echo "  4. Share your website link and capture leads like a boss!"
    echo ""
}

# ═════════════════════════════════════════════════════════════════════════════
# Main
# ═════════════════════════════════════════════════════════════════════════════

main() {
    print_banner

    local skip_android=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-android)
                skip_android=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-android    Skip Android client build"
                echo "  --help, -h        Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    validate_environment
    setup_environment
    start_autobot

    if [ "$skip_android" != true ]; then
        build_android_client
    fi

    show_status
}

main "$@"
