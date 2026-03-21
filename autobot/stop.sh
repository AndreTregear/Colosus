#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Stopping Autobot..."
docker compose down --timeout 15
echo "Stopped."
