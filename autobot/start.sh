#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Generate BETTER_AUTH_SECRET if not set
if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
  if [ -f .env ] && grep -q '^BETTER_AUTH_SECRET=' .env 2>/dev/null; then
    : # already in .env
  else
    SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    echo "BETTER_AUTH_SECRET=$SECRET" >> .env
    echo "Generated BETTER_AUTH_SECRET (saved to .env)"
  fi
fi

# Prompt for admin credentials on first run (if not set)
if [ -z "${ADMIN_EMAIL:-}" ] && ! grep -q '^ADMIN_EMAIL=' .env 2>/dev/null; then
  echo ""
  echo "First-run setup: create an admin account"
  read -rp "  Admin email: " admin_email
  read -rsp "  Admin password: " admin_pass
  echo ""
  read -rp "  Admin name [Admin]: " admin_name
  admin_name="${admin_name:-Admin}"
  {
    echo "ADMIN_EMAIL=$admin_email"
    echo "ADMIN_PASSWORD=$admin_pass"
    echo "ADMIN_NAME=$admin_name"
  } >> .env
  echo "Admin credentials saved to .env (auto-created on startup)"
fi

# Export .env so docker-compose interpolation picks up the values
set -a
[ -f .env ] && source .env
set +a

docker compose up -d --build

PORT="${PORT:-3000}"
echo ""
echo "Autobot running!"
echo "  Customer portal: http://localhost:${PORT}/customer"
echo "  Admin portal:    http://localhost:${PORT}/admin"
echo ""
echo "Logs:  docker compose logs -f app"
echo "Stop:  ./stop.sh"
