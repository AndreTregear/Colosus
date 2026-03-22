#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════
# Yaya Platform — Deploy to c.yaya.sh
# Serves at yaya.sh via Cloudflare tunnel
# ═══════════════════════════════════════════════════════

REMOTE="yaya@c.yaya.sh"
REMOTE_DIR="/home/yaya/yaya-api"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying Yaya Platform to c.yaya.sh..."

# 1. Sync files (exclude node_modules, data)
echo "📦 Syncing files..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='data/' \
  --exclude='.env' \
  "$LOCAL_DIR/" "$REMOTE:$REMOTE_DIR/"

# 2. Install dependencies + seed on remote
echo "📥 Installing dependencies..."
ssh "$REMOTE" "cd $REMOTE_DIR && npm install && mkdir -p data"

# 3. Seed if fresh
ssh "$REMOTE" "cd $REMOTE_DIR && npx tsx seed.ts 2>/dev/null || true"

# 4. Create .env if missing
ssh "$REMOTE" "test -f $REMOTE_DIR/.env || cat > $REMOTE_DIR/.env << 'ENVEOF'
PORT=3000
API_KEY=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
AI_API_URL=https://ai.yaya.sh/v1
AI_API_KEY=megustalaia
AI_MODEL=qwen3.5-27b
DB_PATH=./data/yaya.db
YAPE_LISTENER_URL=http://localhost:3001
ENVEOF"

# 5. Create systemd service
echo "⚙️ Setting up systemd service..."
ssh "$REMOTE" "sudo tee /etc/systemd/system/yaya-api.service > /dev/null << 'SVCEOF'
[Unit]
Description=Yaya Platform API
After=network.target

[Service]
Type=simple
User=yaya
WorkingDirectory=/home/yaya/yaya-api
ExecStart=/usr/bin/npx tsx server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SVCEOF"

# 6. Reload and restart
echo "🔄 Starting service..."
ssh "$REMOTE" "sudo systemctl daemon-reload && sudo systemctl enable yaya-api && sudo systemctl restart yaya-api"

# 7. Wait and check
sleep 3
echo "✅ Checking health..."
ssh "$REMOTE" "curl -s http://localhost:3000/api/v1/health || echo 'waiting...'"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Yaya Platform deployed!"
echo "  📍 Internal: http://c.yaya.sh:3000"
echo "  🌐 Public:   https://yaya.sh (via Cloudflare tunnel)"
echo "  🔑 Login:    gladys@demo.com / yaya2024"
echo "═══════════════════════════════════════════════════════"
