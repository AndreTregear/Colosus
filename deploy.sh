#!/bin/bash
# Yaya Platform — Deploy to c.yaya.sh
# Usage: ./deploy.sh
set -euo pipefail

HOST="yaya@c.yaya.sh"
REMOTE_DIR="/home/yaya/yaya_platform"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Deploying Yaya Platform to c.yaya.sh..."

# 1. Build locally
echo "📦 Building autobot..."
cd "$LOCAL_DIR/autobot"
npm run build
echo "✅ Build complete ($(find dist -name '*.js' | wc -l) files)"

# 2. Sync files to remote (exclude research, android, node_modules, .git)
echo "📤 Syncing to $HOST:$REMOTE_DIR..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='research' \
  --exclude='android' \
  --exclude='docs' \
  --exclude='*.md' \
  --include='autobot/package.json' \
  --include='autobot/package-lock.json' \
  --include='autobot/dist/***' \
  --include='autobot/src/web/public/***' \
  --include='autobot/schema*.sql' \
  --include='autobot/seed*.sql' \
  --include='autobot/.env' \
  --include='autobot/docker-compose.yml' \
  --include='autobot/docker-compose.prod.yml' \
  --include='autobot/Dockerfile' \
  --include='autobot/' \
  --include='infra/***' \
  --include='services/yape-listener/***' \
  --exclude='autobot/src/***' \
  --exclude='autobot/tests/***' \
  --exclude='mcp-servers/***' \
  --exclude='services/***' \
  --exclude='skills/***' \
  --exclude='apps/***' \
  "$LOCAL_DIR/" "$HOST:$REMOTE_DIR/"

# 3. Install production deps on remote
echo "📥 Installing dependencies on remote..."
ssh "$HOST" "cd $REMOTE_DIR/autobot && npm ci --production 2>&1 | tail -5"

# 4. Copy .env if not exists on remote
ssh "$HOST" "test -f $REMOTE_DIR/autobot/.env || echo 'WARNING: No .env on remote! Copy .env.example and configure.'"

# 5. Restart the app
echo "🔄 Restarting autobot..."
ssh "$HOST" "cd $REMOTE_DIR && bash -c '
  # Kill old yaya-api if running
  pkill -f \"tsx.*server.ts\" 2>/dev/null || true
  pkill -f \"node.*dist/index.js\" 2>/dev/null || true
  sleep 2
  
  # Start with nohup
  cd autobot
  LOG_LEVEL=debug nohup node dist/index.js > /tmp/autobot.log 2>&1 &
  echo \"PID: \$!\"
  sleep 3
  
  # Check if running
  if pgrep -f \"node.*dist/index.js\" > /dev/null; then
    echo \"✅ Autobot started successfully\"
    tail -20 /tmp/autobot.log
  else
    echo \"❌ Autobot failed to start. Last logs:\"
    tail -50 /tmp/autobot.log
    exit 1
  fi
'"

echo ""
echo "🎉 Deploy complete!"
echo "   Dashboard: https://cx.yaya.sh:3000"
echo "   Logs: ssh $HOST 'tail -f /tmp/autobot.log'"
