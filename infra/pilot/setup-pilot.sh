#!/usr/bin/env bash
# Yaya Platform — Pilot Setup Script
# Usage: ./infra/pilot/setup-pilot.sh \
#          --name "Sonrisas Dental" \
#          --whatsapp "+51987654321" \
#          --owner-phone "+51912345678" \
#          --type dental
#
# Sets up a complete pilot environment for a specific business.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PILOT_DIR="$REPO_ROOT/infra/pilot"
CLIENTS_DIR="$REPO_ROOT/clients"

# ── Colors ────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

log()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*" >&2; }
info()  { echo -e "${BLUE}[i]${NC} $*"; }
step()  { echo -e "${CYAN}[→]${NC} $*"; }

# ── Parse Arguments ───────────────────────────────────
BUSINESS_NAME=""
WHATSAPP_NUMBER=""
OWNER_PHONE=""
BUSINESS_TYPE=""

usage() {
    cat <<EOF
${BOLD}Yaya Platform — Pilot Setup${NC}

Usage: $(basename "$0") [OPTIONS]

${BOLD}Required:${NC}
  --name NAME               Business name (e.g., "Sonrisas Dental")
  --whatsapp NUMBER          WhatsApp number with country code (e.g., "+51987654321")
  --owner-phone NUMBER       Owner's phone for escalations (e.g., "+51912345678")
  --type TYPE                Business type: dental, beauty, or retail

${BOLD}Optional:${NC}
  --currency CODE            Currency code (default: PEN)
  --timezone TZ              Timezone (default: America/Lima)
  --yape-number NUMBER       Yape phone number for payments
  --yape-name NAME           Yape account holder name
  --deposit-hours HOURS      Hours to wait for deposit (default: 2)
  --help                     Show this help

${BOLD}Examples:${NC}
  $(basename "$0") --name "Sonrisas Dental" --whatsapp "+51987654321" --owner-phone "+51912345678" --type dental
  $(basename "$0") --name "Bella Vita Salon" --whatsapp "+51923456789" --owner-phone "+51934567890" --type beauty

EOF
    exit 0
}

CURRENCY="PEN"
TIMEZONE="America/Lima"
YAPE_NUMBER=""
YAPE_NAME=""
DEPOSIT_HOURS="2"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --name)           BUSINESS_NAME="$2"; shift 2 ;;
        --whatsapp)       WHATSAPP_NUMBER="$2"; shift 2 ;;
        --owner-phone)    OWNER_PHONE="$2"; shift 2 ;;
        --type)           BUSINESS_TYPE="$2"; shift 2 ;;
        --currency)       CURRENCY="$2"; shift 2 ;;
        --timezone)       TIMEZONE="$2"; shift 2 ;;
        --yape-number)    YAPE_NUMBER="$2"; shift 2 ;;
        --yape-name)      YAPE_NAME="$2"; shift 2 ;;
        --deposit-hours)  DEPOSIT_HOURS="$2"; shift 2 ;;
        --help|-h)        usage ;;
        *)                error "Unknown option: $1"; usage ;;
    esac
done

# ── Validate Required Args ────────────────────────────
if [[ -z "$BUSINESS_NAME" ]]; then
    error "Missing required argument: --name"
    usage
fi
if [[ -z "$WHATSAPP_NUMBER" ]]; then
    error "Missing required argument: --whatsapp"
    usage
fi
if [[ -z "$OWNER_PHONE" ]]; then
    error "Missing required argument: --owner-phone"
    usage
fi
if [[ -z "$BUSINESS_TYPE" ]]; then
    error "Missing required argument: --type"
    usage
fi

# Validate business type
case "$BUSINESS_TYPE" in
    dental|beauty|retail) ;;
    *) error "Invalid business type: $BUSINESS_TYPE (must be dental, beauty, or retail)"; exit 1 ;;
esac

# ── Generate Slug ─────────────────────────────────────
# "Sonrisas Dental" → "sonrisas-dental"
SLUG=$(echo "$BUSINESS_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

echo ""
echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Yaya Platform — Pilot Setup${NC}"
echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo ""
info "Business:     $BUSINESS_NAME"
info "Slug:         $SLUG"
info "Type:         $BUSINESS_TYPE"
info "WhatsApp:     $WHATSAPP_NUMBER"
info "Owner Phone:  $OWNER_PHONE"
info "Currency:     $CURRENCY"
info "Timezone:     $TIMEZONE"
echo ""

# ── Step 1: Create Client Directory ───────────────────
CLIENT_DIR="$CLIENTS_DIR/$SLUG"
step "Creating client directory: $CLIENT_DIR"

mkdir -p "$CLIENT_DIR/config"
mkdir -p "$CLIENT_DIR/data"
mkdir -p "$CLIENT_DIR/logs"

log "Client directory created"

# ── Step 2: Generate hermes.json ────────────────────
step "Generating Hermes configuration"

# Copy template and substitute variables
sed \
    -e "s|\${BUSINESS_NAME}|${BUSINESS_NAME}|g" \
    -e "s|\${WHATSAPP_API_URL}|${WHATSAPP_API_URL:-}|g" \
    -e "s|\${WHATSAPP_API_TOKEN}|${WHATSAPP_API_TOKEN:-}|g" \
    -e "s|\${WHATSAPP_PHONE_NUMBER_ID}|${WHATSAPP_PHONE_NUMBER_ID:-}|g" \
    -e "s|\${VLLM_API_KEY:-none}|${VLLM_API_KEY:-none}|g" \
    -e "s|\${DATABASE_URL:-postgresql://localhost:5432/appointments}|postgresql://localhost:5432/${SLUG//-/_}|g" \
    -e "s|\${BUSINESS_TIMEZONE:-America/Lima}|${TIMEZONE}|g" \
    -e "s|\${CAL_COM_API_URL:-http://localhost:3000/api/v1}|${CAL_COM_API_URL:-http://localhost:3000/api/v1}|g" \
    -e "s|\${CAL_COM_API_KEY}|${CAL_COM_API_KEY:-}|g" \
    -e "s|\${DEPOSIT_EXPIRY_HOURS:-2}|${DEPOSIT_HOURS}|g" \
    -e "s|\${SUNAT_SOL_USER}|${SUNAT_SOL_USER:-}|g" \
    -e "s|\${SUNAT_SOL_PASSWORD}|${SUNAT_SOL_PASSWORD:-}|g" \
    -e "s|\${SUNAT_RUC}|${SUNAT_RUC:-}|g" \
    -e "s|\${SUNAT_CERTIFICATE_PATH}|${SUNAT_CERTIFICATE_PATH:-}|g" \
    -e "s|\${SUNAT_API_URL}|${SUNAT_API_URL:-}|g" \
    -e "s|\${BASE_CURRENCY:-PEN}|${CURRENCY}|g" \
    -e "s|\${YAPE_NUMBER}|${YAPE_NUMBER}|g" \
    -e "s|\${YAPE_NAME}|${YAPE_NAME}|g" \
    -e "s|\${PAYMENT_METHODS:-yape,plin,bank_transfer}|yape,plin,bank_transfer|g" \
    -e "s|\${PAYMENT_VALIDATION_WEBHOOK:-http://localhost:3002}|http://localhost:3002|g" \
    -e "s|\${SUPABASE_URL:-http://localhost:54321}|${SUPABASE_URL:-http://localhost:54321}|g" \
    -e "s|\${SUPABASE_ANON_KEY}|${SUPABASE_ANON_KEY:-}|g" \
    -e "s|\${SUPABASE_SERVICE_KEY}|${SUPABASE_SERVICE_KEY:-}|g" \
    -e "s|\${DATABASE_URL:-postgresql://localhost:5432/yaya}|postgresql://localhost:5432/${SLUG//-/_}|g" \
    -e "s|\${OWNER_PHONE}|${OWNER_PHONE}|g" \
    -e "s|\${CURRENCY:-PEN}|${CURRENCY}|g" \
    -e "s|\${ERPNEXT_URL:-http://localhost:8080}|${ERPNEXT_URL:-http://localhost:8080}|g" \
    -e "s|\${ERPNEXT_API_KEY}|${ERPNEXT_API_KEY:-}|g" \
    -e "s|\${ERPNEXT_API_SECRET}|${ERPNEXT_API_SECRET:-}|g" \
    "$PILOT_DIR/hermes.json" > "$CLIENT_DIR/config/hermes.json"

log "Hermes configuration generated"

# ── Step 3: Generate SOUL.md ──────────────────────────
step "Generating agent personality (SOUL.md)"

sed \
    -e "s|{{BUSINESS_NAME}}|${BUSINESS_NAME}|g" \
    -e "s|{{OWNER_PHONE}}|${OWNER_PHONE}|g" \
    "$PILOT_DIR/SOUL.md" > "$CLIENT_DIR/config/SOUL.md"

# Add business-type specific sections
case "$BUSINESS_TYPE" in
    dental)
        cat >> "$CLIENT_DIR/config/SOUL.md" <<'DENTAL_EOF'

## Especialización: Clínica Dental

### Servicios Típicos
- Limpieza dental (básica, profunda, con blanqueamiento)
- Evaluaciones y revisiones
- Extracciones
- Tratamientos de conducto
- Ortodoncia (consultas)
- Emergencias dentales

### Vocabulario del Rubro
- "Cita" (no "turno" ni "consulta" a menos que el cliente lo use)
- "Doctor/Doctora" (no "proveedor")
- "Consultorio" (no "local" ni "establecimiento")
- Emojis: 🦷 para servicios dentales, 👩‍⚕️👨‍⚕️ para doctores

### Reglas Especiales
- Las emergencias dentales (dolor intenso, sangrado, inflamación) siempre tienen prioridad.
- Nunca des diagnósticos ni recomendaciones de tratamiento. Solo agenda y el doctor evaluará.
- Para procedimientos que requieren radiografías previas, menciónalo: "El doctor podría necesitar una radiografía antes del procedimiento."
- Depósitos recomendados para: blanqueamiento, ortodoncia, procedimientos mayores.
DENTAL_EOF
        log "Dental specialization added"
        ;;

    beauty)
        cat >> "$CLIENT_DIR/config/SOUL.md" <<'BEAUTY_EOF'

## Especialización: Salón de Belleza

### Servicios Típicos
- Corte de cabello (dama, caballero, niños)
- Tinte y color
- Manicure y pedicure
- Tratamientos capilares (keratina, botox capilar)
- Maquillaje
- Depilación

### Vocabulario del Rubro
- "Cita" o "reserva" (ambos son comunes)
- "Estilista" o nombre propio del profesional
- "Salón" (no "local")
- Emojis: 💇 cortes, 💅 uñas, ✨ tratamientos, 💄 maquillaje

### Reglas Especiales
- Para servicios de tinte/color, preguntar si es primera vez o retoque (la duración cambia).
- Para tratamientos capilares, recomendar llegar con cabello limpio si aplica.
- Los servicios combinados (corte + tinte, manicure + pedicure) son muy comunes — calcula la duración total.
- Depósitos recomendados para: tratamientos de keratina, paquetes de novia, servicios largos (+2h).
- Si el cliente manda foto de referencia para un estilo, confirma: "¡Bonito estilo! Se lo mostraré a [estilista] para que lo tenga listo."
BEAUTY_EOF
        log "Beauty specialization added"
        ;;

    retail)
        cat >> "$CLIENT_DIR/config/SOUL.md" <<'RETAIL_EOF'

## Especialización: Tienda / Retail

### Funciones Principales
- Consultar productos y precios
- Verificar disponibilidad de stock
- Tomar pedidos por WhatsApp
- Procesar pagos (Yape, Plin, transferencia)
- Coordinar entregas o recojo en tienda
- Generar boletas/facturas

### Vocabulario del Rubro
- "Pedido" (no "orden" a menos que el cliente lo use)
- "Tienda" (no "local" ni "establecimiento")
- "Disponible" / "agotado" para stock
- Emojis: 🛍️ compras, 📦 pedidos, 🚚 entregas, 💳 pagos

### Reglas Especiales
- Siempre confirmar stock antes de aceptar un pedido.
- Para productos con variantes (talla, color), confirmar la variante exacta.
- Si un producto está agotado, ofrecer alternativas similares.
- Para pedidos grandes (>10 unidades), ofrecer consultar precio mayorista con el dueño.
- Depósitos recomendados para: pedidos especiales, apartados, productos por encargo.
- Delivery: confirmar dirección, rango de entrega y costo adicional si aplica.
RETAIL_EOF
        log "Retail specialization added"
        ;;
esac

# ── Step 4: Generate .env File ────────────────────────
step "Generating environment file"

cat > "$CLIENT_DIR/.env" <<ENVFILE
# Yaya Platform — ${BUSINESS_NAME}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Type: ${BUSINESS_TYPE}

# ── Business ──────────────────────────────────────
BUSINESS_NAME="${BUSINESS_NAME}"
BUSINESS_TYPE="${BUSINESS_TYPE}"
BUSINESS_SLUG="${SLUG}"
BUSINESS_TIMEZONE="${TIMEZONE}"
CURRENCY="${CURRENCY}"
OWNER_PHONE="${OWNER_PHONE}"

# ── WhatsApp ──────────────────────────────────────
WHATSAPP_NUMBER="${WHATSAPP_NUMBER}"
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# ── Database ──────────────────────────────────────
DATABASE_URL=postgresql://yaya:yaya@localhost:5432/${SLUG//-/_}

# ── Payments ──────────────────────────────────────
YAPE_NUMBER=${YAPE_NUMBER}
YAPE_NAME=${YAPE_NAME}
PAYMENT_METHODS=yape,plin,bank_transfer

# ── Appointments ──────────────────────────────────
APPOINTMENT_BUFFER=10
APPOINTMENT_ADVANCE_DAYS=30
CANCELLATION_WINDOW_HOURS=24
DEPOSIT_EXPIRY_HOURS=${DEPOSIT_HOURS}

# ── Cal.com (optional) ───────────────────────────
CAL_COM_API_URL=http://localhost:3000/api/v1
CAL_COM_API_KEY=

# ── SUNAT (optional) ─────────────────────────────
SUNAT_RUC=
SUNAT_SOL_USER=
SUNAT_SOL_PASSWORD=
SUNAT_CERTIFICATE_PATH=
SUNAT_API_URL=

# ── ERPNext (optional) ───────────────────────────
ERPNEXT_URL=http://localhost:8080
ERPNEXT_API_KEY=
ERPNEXT_API_SECRET=

# ── Supabase / CRM ───────────────────────────────
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# ── LLM ──────────────────────────────────────────
VLLM_API_KEY=none
ENVFILE

log "Environment file generated: $CLIENT_DIR/.env"

# ── Step 5: Configure MCP Server Endpoints ────────────
step "Verifying MCP server builds"

MCP_SERVERS=(
    "erpnext-mcp"
    "appointments-mcp"
    "invoicing-mcp"
    "forex-mcp"
    "payments-mcp"
    "crm-mcp"
    "postgres-mcp"
)

MCP_READY=0
MCP_MISSING=0

for server in "${MCP_SERVERS[@]}"; do
    SERVER_DIR="$REPO_ROOT/mcp-servers/$server"
    if [[ -d "$SERVER_DIR" ]]; then
        if [[ -f "$SERVER_DIR/dist/index.js" ]]; then
            log "$server: built ✓"
            ((MCP_READY++))
        elif [[ -f "$SERVER_DIR/src/index.ts" ]]; then
            warn "$server: source exists, needs build (run: cd $SERVER_DIR && npm run build)"
            ((MCP_MISSING++))
        else
            warn "$server: directory exists but no source found"
            ((MCP_MISSING++))
        fi
    else
        warn "$server: not found at $SERVER_DIR"
        ((MCP_MISSING++))
    fi
done

echo ""
info "MCP servers: $MCP_READY ready, $MCP_MISSING need attention"

# ── Step 6: Link WhatsApp Number ──────────────────────
step "Registering WhatsApp number"

cat > "$CLIENT_DIR/config/whatsapp.json" <<WACONFIG
{
  "phoneNumber": "${WHATSAPP_NUMBER}",
  "displayName": "${BUSINESS_NAME}",
  "ownerPhone": "${OWNER_PHONE}",
  "businessType": "${BUSINESS_TYPE}",
  "registeredAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "pending_verification",
  "notes": "Configure WHATSAPP_API_URL and WHATSAPP_API_TOKEN in .env after Meta Business verification"
}
WACONFIG

log "WhatsApp configuration saved"

# ── Step 7: Setup Checks ─────────────────────────────
echo ""
echo -e "${BOLD}── Pre-flight Checks ──────────────────────────${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check PostgreSQL
if command -v psql &>/dev/null; then
    if pg_isready -q 2>/dev/null; then
        log "PostgreSQL: running"
        ((CHECKS_PASSED++))
    else
        warn "PostgreSQL: not running (start with: docker compose up -d postgres)"
        ((CHECKS_FAILED++))
    fi
else
    warn "PostgreSQL: psql not in PATH"
    ((CHECKS_FAILED++))
fi

# Check Docker
if command -v docker &>/dev/null; then
    if docker info &>/dev/null 2>&1; then
        log "Docker: running"
        ((CHECKS_PASSED++))
    else
        warn "Docker: installed but not running"
        ((CHECKS_FAILED++))
    fi
else
    warn "Docker: not installed"
    ((CHECKS_FAILED++))
fi

# Check Node.js
if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    log "Node.js: $NODE_VERSION"
    ((CHECKS_PASSED++))
else
    warn "Node.js: not installed"
    ((CHECKS_FAILED++))
fi

# Check vLLM endpoint
if curl -s --connect-timeout 2 http://localhost:8000/health >/dev/null 2>&1; then
    log "vLLM (Qwen3.5-27B): running"
    ((CHECKS_PASSED++))
else
    warn "vLLM: not reachable at localhost:8000 (start with: docker compose up -d vllm)"
    ((CHECKS_FAILED++))
fi

# Check Redis
if curl -s --connect-timeout 2 redis://localhost:6379 >/dev/null 2>&1 || \
   (command -v redis-cli &>/dev/null && redis-cli ping >/dev/null 2>&1); then
    log "Redis: running"
    ((CHECKS_PASSED++))
else
    warn "Redis: not reachable at localhost:6379"
    ((CHECKS_FAILED++))
fi

# Check Hermes policy
if [[ -f "$REPO_ROOT/infra/hermes/policy.yaml" ]]; then
    log "Hermes policy: found"
    ((CHECKS_PASSED++))
else
    warn "Hermes policy: missing at infra/hermes/policy.yaml"
    ((CHECKS_FAILED++))
fi

# Check SOUL.md was generated
if [[ -f "$CLIENT_DIR/config/SOUL.md" ]]; then
    log "SOUL.md: generated"
    ((CHECKS_PASSED++))
else
    error "SOUL.md: failed to generate!"
    ((CHECKS_FAILED++))
fi

# Check hermes.json was generated
if [[ -f "$CLIENT_DIR/config/hermes.json" ]]; then
    log "hermes.json: generated"
    ((CHECKS_PASSED++))
else
    error "hermes.json: failed to generate!"
    ((CHECKS_FAILED++))
fi

# ── Final Status ──────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════${NC}"

if [[ $CHECKS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}  ✅ READY FOR PILOT${NC}"
else
    echo -e "${YELLOW}${BOLD}  ⚠️  READY FOR PILOT (with $CHECKS_FAILED warnings)${NC}"
fi

echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo ""
info "Client directory: $CLIENT_DIR"
info "Config:           $CLIENT_DIR/config/hermes.json"
info "Personality:      $CLIENT_DIR/config/SOUL.md"
info "Environment:      $CLIENT_DIR/.env"
echo ""

echo -e "${BOLD}Next steps:${NC}"
echo "  1. Review and fill in missing values in $CLIENT_DIR/.env"
echo "  2. Build MCP servers: cd mcp-servers/<name> && npm install && npm run build"
echo "  3. Start infrastructure: cd infra/docker && docker compose up -d"
echo "  4. Configure WhatsApp Business API credentials in .env"
if [[ -n "$YAPE_NUMBER" ]]; then
    echo "  5. Yape payment number configured: $YAPE_NUMBER"
else
    echo "  5. Configure Yape payment number in .env (YAPE_NUMBER, YAPE_NAME)"
fi
echo "  6. Run: hermes start --config $CLIENT_DIR/config/hermes.json"
echo ""
