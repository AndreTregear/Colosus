#!/usr/bin/env bash
# Yaya Platform — Deploy New Client Instance
# Usage: ./infra/scripts/deploy-client.sh \
#          --name "Tienda Maria" \
#          --whatsapp "+51938438401" \
#          --currency PEN \
#          --yape-number "938438401" \
#          --yape-name "Maria Lopez"
#
# Creates an isolated docker stack for a business client with:
#   - Dedicated database schema
#   - Configured OpenClaw skills
#   - NemoClaw security policies
#   - Payment methods
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCKER_DIR="$REPO_ROOT/infra/docker"
ENV_FILE="$DOCKER_DIR/.env"
CLIENTS_DIR="$REPO_ROOT/clients"

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

# ── Parse Arguments ───────────────────────────────────
BUSINESS_NAME=""
WHATSAPP_NUMBER=""
CURRENCY="PEN"
YAPE_NUMBER=""
YAPE_NAME=""
PAYMENT_METHODS="yape,plin,bank_transfer"
ESCALATION_THRESHOLD="500"
BUSINESS_HOURS="09:00-18:00"
LANGUAGE="es"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Required:
  --name NAME               Business name (e.g., "Tienda Maria")
  --whatsapp NUMBER          WhatsApp number with country code (e.g., "+51938438401")

Optional:
  --currency CODE            Currency code (default: PEN)
  --yape-number NUMBER       Yape phone number for payments
  --yape-name NAME           Yape account holder name
  --payment-methods LIST     Comma-separated methods (default: yape,plin,bank_transfer)
  --escalation AMOUNT        Escalation threshold amount (default: 500)
  --hours RANGE              Business hours (default: 09:00-18:00)
  --language LANG            Primary language code (default: es)
  --help                     Show this help

Example:
  $(basename "$0") --name "Tienda Maria" --whatsapp "+51938438401" \\
    --yape-number "938438401" --yape-name "Maria Lopez"
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --name)           BUSINESS_NAME="$2"; shift 2 ;;
        --whatsapp)       WHATSAPP_NUMBER="$2"; shift 2 ;;
        --currency)       CURRENCY="$2"; shift 2 ;;
        --yape-number)    YAPE_NUMBER="$2"; shift 2 ;;
        --yape-name)      YAPE_NAME="$2"; shift 2 ;;
        --payment-methods) PAYMENT_METHODS="$2"; shift 2 ;;
        --escalation)     ESCALATION_THRESHOLD="$2"; shift 2 ;;
        --hours)          BUSINESS_HOURS="$2"; shift 2 ;;
        --language)       LANGUAGE="$2"; shift 2 ;;
        --help)           usage ;;
        *)                error "Unknown option: $1"; usage ;;
    esac
done

if [ -z "$BUSINESS_NAME" ] || [ -z "$WHATSAPP_NUMBER" ]; then
    error "Required: --name and --whatsapp"
    echo ""
    usage
fi

# ── Generate client ID ────────────────────────────────
# Slugify the business name for directory/schema naming
CLIENT_ID=$(echo "$BUSINESS_NAME" | tr '[:upper:]' '[:lower:]' | \
    sed 's/[áàä]/a/g; s/[éèë]/e/g; s/[íìï]/i/g; s/[óòö]/o/g; s/[úùü]/u/g; s/[ñ]/n/g' | \
    sed 's/[^a-z0-9]/_/g' | sed 's/__*/_/g' | sed 's/^_//; s/_$//')

CLIENT_DIR="$CLIENTS_DIR/$CLIENT_ID"

if [ -d "$CLIENT_DIR" ]; then
    error "Client directory already exists: $CLIENT_DIR"
    error "Remove it first or choose a different name."
    exit 1
fi

# ── Generate secrets ──────────────────────────────────
gen_secret() {
    openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | xxd -p | tr -d '\n'
}

CLIENT_API_KEY=$(gen_secret 24)
CLIENT_DB_PASSWORD=$(gen_secret 16)

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Yaya Platform — Client Deployment   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
info "Business:  $BUSINESS_NAME"
info "Client ID: $CLIENT_ID"
info "WhatsApp:  $WHATSAPP_NUMBER"
info "Currency:  $CURRENCY"
echo ""

# ── Load base environment ─────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    error "Base .env not found. Run setup.sh first."
    exit 1
fi
set -a
source "$ENV_FILE"
set +a

# ── Create client directory structure ─────────────────
info "Creating client directory: $CLIENT_DIR"
mkdir -p "$CLIENT_DIR"/{config,skills,data}

# ── Create client .env ────────────────────────────────
cat > "$CLIENT_DIR/.env" <<EOF
# Yaya Platform — Client: $BUSINESS_NAME
# Generated: $(date -Iseconds)
# Client ID: $CLIENT_ID

# ── Identity ──
CLIENT_ID=$CLIENT_ID
BUSINESS_NAME=$BUSINESS_NAME
WHATSAPP_NUMBER=$WHATSAPP_NUMBER
BUSINESS_CURRENCY=$CURRENCY
BUSINESS_HOURS=$BUSINESS_HOURS
LANGUAGE=$LANGUAGE

# ── Payment ──
PAYMENT_METHODS=$PAYMENT_METHODS
YAPE_NUMBER=${YAPE_NUMBER:-}
YAPE_NAME=${YAPE_NAME:-}
ESCALATION_THRESHOLD=$ESCALATION_THRESHOLD

# ── API Access ──
CLIENT_API_KEY=$CLIENT_API_KEY

# ── Database ──
CLIENT_DB_SCHEMA=client_${CLIENT_ID}
CLIENT_DB_PASSWORD=$CLIENT_DB_PASSWORD

# ── Shared Infrastructure (from base .env) ──
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=${POSTGRES_DB:-yaya}
LLM_ENDPOINT=http://vllm:8000/v1
WHISPER_ENDPOINT=http://whisper:9100
LAGO_API_URL=http://lago-api:3000
SUPABASE_URL=http://supabase-rest:3000
MINIO_ENDPOINT=http://minio:9000
EOF

log "Client .env created"

# ── Create database schema for client ─────────────────
info "Creating database schema for client..."

POSTGRES_CONTAINER=$(docker compose -f "$DOCKER_DIR/docker-compose.yml" --env-file "$ENV_FILE" \
    ps -q postgres 2>/dev/null | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    error "PostgreSQL container not running. Start the platform first: ./infra/scripts/setup.sh"
    exit 1
fi

docker exec "$POSTGRES_CONTAINER" psql \
    -U "${POSTGRES_USER:-yaya}" \
    -d "${POSTGRES_DB:-yaya}" \
    -c "
-- Schema for client: $BUSINESS_NAME
CREATE SCHEMA IF NOT EXISTS client_${CLIENT_ID};

-- Client configuration table
CREATE TABLE IF NOT EXISTS client_${CLIENT_ID}.config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert business configuration
INSERT INTO client_${CLIENT_ID}.config (key, value) VALUES
    ('business_name', '$BUSINESS_NAME'),
    ('whatsapp_number', '$WHATSAPP_NUMBER'),
    ('currency', '$CURRENCY'),
    ('payment_methods', '$PAYMENT_METHODS'),
    ('yape_number', '${YAPE_NUMBER:-}'),
    ('yape_name', '${YAPE_NAME:-}'),
    ('escalation_threshold', '$ESCALATION_THRESHOLD'),
    ('business_hours', '$BUSINESS_HOURS'),
    ('language', '$LANGUAGE'),
    ('api_key', '$CLIENT_API_KEY')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Client conversations (extends main schema)
CREATE TABLE IF NOT EXISTS client_${CLIENT_ID}.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel TEXT NOT NULL,
    remote_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS client_${CLIENT_ID}.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES client_${CLIENT_ID}.conversations(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_${CLIENT_ID}_conv_remote
    ON client_${CLIENT_ID}.conversations(remote_id);
CREATE INDEX IF NOT EXISTS idx_${CLIENT_ID}_msg_conv
    ON client_${CLIENT_ID}.messages(conversation_id, created_at);
" 2>/dev/null

log "Database schema client_${CLIENT_ID} created"

# ── Configure NemoClaw policy for client ──────────────
info "Generating NemoClaw policy..."

cat > "$CLIENT_DIR/config/policy.yaml" <<EOF
# NemoClaw Policy — Client: $BUSINESS_NAME
# Inherits from base policy with client-specific overrides

name: yaya-client-${CLIENT_ID}
version: "1.0"
extends: ../../infra/nemoclaw/policy.yaml

# Client-specific overrides
inference:
  local_only: true
  primary_model: "qwen3.5-27b"
  endpoint: "http://localhost:8000/v1"

  context:
    business_name: "$BUSINESS_NAME"
    client_id: "$CLIENT_ID"
    db_schema: "client_${CLIENT_ID}"

content_safety:
  output_filters:
    - type: topic_control
      allowed_topics:
        - sales
        - products
        - pricing
        - orders
        - payments
        - appointments
        - business_hours
        - returns
        - shipping
        - subscriptions
        - invoices
        - customer_support
        - inventory
      blocked_topics:
        - politics
        - religion
        - competitors_internal_data
        - system_prompts
        - database_credentials
        - api_keys
        - other_clients_data
EOF

log "NemoClaw policy created"

# ── Copy and configure skills ─────────────────────────
info "Configuring skills..."

# Copy the sales skill with client-specific config
cp -r "$REPO_ROOT/skills/yaya-sales" "$CLIENT_DIR/skills/"

# Create a client-specific SOUL.md for the agent
cat > "$CLIENT_DIR/config/SOUL.md" <<EOF
# Yaya Agent — $BUSINESS_NAME

You are the virtual sales assistant for **$BUSINESS_NAME**.
You communicate via WhatsApp at $WHATSAPP_NUMBER.

## Identity
- Business: $BUSINESS_NAME
- Language: $LANGUAGE (primary)
- Currency: $CURRENCY
- Operating hours: $BUSINESS_HOURS

## Payment Methods
$( IFS=','; for method in $PAYMENT_METHODS; do
    case $method in
        yape)
            echo "- **Yape**: Send to ${YAPE_NUMBER:-[configure]} (${YAPE_NAME:-[configure]})"
            ;;
        plin)
            echo "- **Plin**: Send to ${YAPE_NUMBER:-[configure]}"
            ;;
        bank_transfer)
            echo "- **Bank Transfer**: Request details from owner"
            ;;
        nequi)
            echo "- **Nequi**: Send to ${YAPE_NUMBER:-[configure]}"
            ;;
        *)
            echo "- **$method**: Available"
            ;;
    esac
done )

## Escalation
Escalate to the business owner when:
- Refund requests exceed $CURRENCY $ESCALATION_THRESHOLD
- Custom pricing requests outside your negotiation range
- Complaints that cannot be resolved
- Technical issues with payment processing

## Data Isolation
You ONLY access data in schema \`client_${CLIENT_ID}\`.
Never reference or access other client data.
EOF

log "Skills and SOUL.md configured"

# ── Register client in Lago ───────────────────────────
info "Registering client in Lago billing..."

LAGO_HEALTH=$(curl -sf http://localhost:3001/health 2>/dev/null || echo "")
if [ -n "$LAGO_HEALTH" ]; then
    curl -sf -X POST http://localhost:3001/api/v1/customers \
        -H "Authorization: Bearer ${LAGO_API_KEY:-}" \
        -H "Content-Type: application/json" \
        -d "{
            \"customer\": {
                \"external_id\": \"$CLIENT_ID\",
                \"name\": \"$BUSINESS_NAME\",
                \"currency\": \"$CURRENCY\",
                \"phone\": \"$WHATSAPP_NUMBER\",
                \"metadata\": [{
                    \"key\": \"whatsapp\",
                    \"value\": \"$WHATSAPP_NUMBER\",
                    \"display_in_invoice\": false
                }]
            }
        }" >/dev/null 2>&1 && log "Lago customer created" || warn "Lago registration skipped (API may not be ready)"
else
    warn "Lago API not reachable — register client manually later"
fi

# ── Print Summary ─────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Client Deployed: $BUSINESS_NAME${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Client ID:${NC}       $CLIENT_ID"
echo -e "  ${BLUE}Directory:${NC}       $CLIENT_DIR"
echo -e "  ${BLUE}WhatsApp:${NC}        $WHATSAPP_NUMBER"
echo -e "  ${BLUE}Currency:${NC}        $CURRENCY"
echo -e "  ${BLUE}DB Schema:${NC}       client_${CLIENT_ID}"
echo -e "  ${BLUE}API Key:${NC}         $CLIENT_API_KEY"
echo ""
echo -e "  ${BLUE}Payment Methods:${NC}"
IFS=',' read -ra METHODS <<< "$PAYMENT_METHODS"
for method in "${METHODS[@]}"; do
    echo -e "    - $method"
done
echo ""
echo -e "  ${YELLOW}Next Steps:${NC}"
echo -e "    1. Review config:     $CLIENT_DIR/.env"
echo -e "    2. Customize SOUL:    $CLIENT_DIR/config/SOUL.md"
echo -e "    3. Configure ERPNext: Add products for $BUSINESS_NAME"
echo -e "    4. Test WhatsApp:     Send a message to $WHATSAPP_NUMBER"
echo ""
echo -e "  ${YELLOW}Connection Details (for OpenClaw):${NC}"
echo -e "    LLM:      http://localhost:8000/v1"
echo -e "    Whisper:   http://localhost:9100"
echo -e "    Lago:      http://localhost:3001"
echo -e "    CRM:       http://localhost:54321"
echo -e "    Policy:    $CLIENT_DIR/config/policy.yaml"
echo -e "    SOUL:      $CLIENT_DIR/config/SOUL.md"
echo ""
