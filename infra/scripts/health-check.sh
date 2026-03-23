#!/bin/bash
# Yaya Platform — Production Health Check
# Run: bash infra/scripts/health-check.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

check() {
  local name="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    echo -e "  ${GREEN}✓${NC} $name"
    PASS=$((PASS + 1))
  elif [ "$result" = "warn" ]; then
    echo -e "  ${YELLOW}!${NC} $name"
    WARN=$((WARN + 1))
  else
    echo -e "  ${RED}✗${NC} $name — $result"
    FAIL=$((FAIL + 1))
  fi
}

echo '=== Yaya Platform Health Check ==='
echo ""

# ── Services ──
echo '--- Services ---'

# Autobot (Express)
if curl -sf http://localhost:3000/api/v1/health > /dev/null 2>&1; then
  check "Autobot (Express :3000)" "ok"
else
  check "Autobot (Express :3000)" "not responding"
fi

# PostgreSQL
if pg_isready -q 2>/dev/null; then
  check "PostgreSQL" "ok"
elif psql "${DATABASE_URL:-}" -c "SELECT 1" > /dev/null 2>&1; then
  check "PostgreSQL" "ok"
else
  check "PostgreSQL" "not responding"
fi

# Redis
if redis-cli ping 2>/dev/null | grep -q PONG; then
  check "Redis" "ok"
else
  check "Redis" "not responding"
fi

# vLLM
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
  check "vLLM (inference :8000)" "ok"
else
  check "vLLM (inference :8000)" "not responding"
fi

# OpenClaw
if curl -sf http://localhost:3100/api/v1/health > /dev/null 2>&1; then
  check "OpenClaw (agent :3100)" "ok"
else
  check "OpenClaw (agent :3100)" "not responding"
fi

# Lago
if curl -sf http://localhost:3200/health > /dev/null 2>&1; then
  check "Lago (billing :3200)" "ok"
else
  check "Lago (billing :3200)" "not responding"
fi

# Cal.com
if curl -sf http://localhost:3300/api/health > /dev/null 2>&1; then
  check "Cal.com (calendar :3300)" "ok"
else
  check "Cal.com (calendar :3300)" "not responding"
fi

# Metabase
if curl -sf http://localhost:3400/api/health > /dev/null 2>&1; then
  check "Metabase (analytics :3400)" "ok"
else
  check "Metabase (analytics :3400)" "not responding"
fi

# MinIO
if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
  check "MinIO (S3 :9000)" "ok"
else
  check "MinIO (S3 :9000)" "not responding"
fi

# Whisper
if curl -sf http://localhost:8001/health > /dev/null 2>&1; then
  check "Whisper (STT :8001)" "ok"
else
  check "Whisper (STT :8001)" "not responding"
fi

# Kokoro TTS
if curl -sf http://localhost:8002/health > /dev/null 2>&1; then
  check "Kokoro (TTS :8002)" "ok"
else
  check "Kokoro (TTS :8002)" "not responding"
fi

# LangFuse
if curl -sf http://localhost:3001/api/public/health > /dev/null 2>&1; then
  check "LangFuse (observability :3001)" "ok"
else
  check "LangFuse (observability :3001)" "not responding"
fi

echo ""

# ── Encryption ──
echo '--- Encryption ---'

if [ -n "${DATABASE_URL:-}" ]; then
  ENC_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM tenant_encryption_keys" 2>/dev/null || echo "error")
  if [ "$ENC_COUNT" != "error" ]; then
    check "Encryption keys table ($ENC_COUNT tenants)" "ok"
  else
    check "Encryption keys table" "query failed"
  fi
else
  check "Encryption keys table" "DATABASE_URL not set"
fi

echo ""

# ── RLS Policies ──
echo '--- Row-Level Security ---'

if [ -n "${DATABASE_URL:-}" ]; then
  RLS_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM pg_policies" 2>/dev/null || echo "error")
  if [ "$RLS_COUNT" != "error" ]; then
    if [ "$RLS_COUNT" -ge 40 ]; then
      check "RLS policies ($RLS_COUNT active)" "ok"
    else
      check "RLS policies ($RLS_COUNT active, expected 40+)" "warn"
    fi
  else
    check "RLS policies" "query failed"
  fi
else
  check "RLS policies" "DATABASE_URL not set"
fi

echo ""

# ── RL Pipeline ──
echo '--- RL Pipeline ---'

ROLLOUT_DIR="${ROLLOUT_DIR:-/home/yaya/rollouts}"
if [ -d "$ROLLOUT_DIR" ]; then
  ROLLOUT_COUNT=$(find "$ROLLOUT_DIR" -name '*.jsonl' -mtime -1 | wc -l)
  check "Rollout directory ($ROLLOUT_COUNT files in last 24h)" "ok"
else
  check "Rollout directory ($ROLLOUT_DIR)" "not found"
fi

# Check for active LoRA adapter
if [ -d "${LORA_DIR:-/home/yaya/lora-adapters}" ]; then
  ADAPTER_COUNT=$(ls -d "${LORA_DIR:-/home/yaya/lora-adapters}"/*/ 2>/dev/null | wc -l)
  check "LoRA adapters ($ADAPTER_COUNT available)" "ok"
else
  check "LoRA adapters" "directory not found"
fi

echo ""

# ── System Resources ──
echo '--- System Resources ---'

# GPU memory
if command -v nvidia-smi &> /dev/null; then
  GPU_INFO=$(nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "")
  if [ -n "$GPU_INFO" ]; then
    GPU_IDX=0
    while IFS=, read -r used total; do
      used=$(echo "$used" | tr -d ' ')
      total=$(echo "$total" | tr -d ' ')
      PCT=$((used * 100 / total))
      if [ "$PCT" -gt 95 ]; then
        check "GPU $GPU_IDX: ${used}MB / ${total}MB (${PCT}%)" "warn"
      else
        check "GPU $GPU_IDX: ${used}MB / ${total}MB (${PCT}%)" "ok"
      fi
      GPU_IDX=$((GPU_IDX + 1))
    done <<< "$GPU_INFO"
  else
    check "GPU memory" "nvidia-smi failed"
  fi
else
  check "GPU" "nvidia-smi not found"
fi

# Disk space
DISK_PCT=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
if [ "$DISK_PCT" -gt 90 ]; then
  check "Disk: ${DISK_PCT}% used (${DISK_AVAIL} free)" "warn"
else
  check "Disk: ${DISK_PCT}% used (${DISK_AVAIL} free)" "ok"
fi

# RAM
MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
MEM_AVAIL=$(free -h | awk '/Mem:/ {print $7}')
if [ "$MEM_PCT" -gt 90 ]; then
  check "RAM: ${MEM_PCT}% used (${MEM_AVAIL} available)" "warn"
else
  check "RAM: ${MEM_PCT}% used (${MEM_AVAIL} available)" "ok"
fi

echo ""
echo "=== Summary ==="
echo -e "  ${GREEN}${PASS} passed${NC}  ${YELLOW}${WARN} warnings${NC}  ${RED}${FAIL} failed${NC}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
