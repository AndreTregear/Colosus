#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping Yaya Commerce Platform..."

cd "${SCRIPT_DIR}/autobot"
docker compose down --timeout 15 2>/dev/null || true

echo "All services stopped"
