# Yaya Platform — Deployment Guide

Step-by-step guide for deploying Yaya Platform on `c.yaya.sh`.

## Prerequisites

### Hardware
- 2x NVIDIA GPUs with 24GB+ VRAM each (A100 80GB recommended)
- 64GB+ RAM (128GB recommended)
- 500GB+ SSD storage
- Ubuntu 22.04+ or Debian 12+

### Software
- Docker Engine 24+
- Docker Compose v2+
- NVIDIA Container Toolkit (nvidia-docker2)
- Git 2.30+
- `openssl` (for secret generation)
- `mc` (MinIO Client, optional but recommended)

### Verify NVIDIA Setup

```bash
# Check GPU visibility
nvidia-smi

# Verify docker can see GPUs
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
```

## Step 1: Clone the Repository

```bash
git clone --recursive git@github.com:AndreTregear/yaya_platform.git
cd yaya_platform
```

If you forgot `--recursive`:
```bash
git submodule update --init --recursive
```

## Step 2: Download the Model

Download Qwen3.5-27B-AWQ to the model directory:

```bash
mkdir -p /home/yaya/models
cd /home/yaya/models

# Using huggingface-cli
pip install huggingface-hub
huggingface-cli download Qwen/Qwen3.5-27B-AWQ --local-dir Qwen3.5-27B-AWQ

# Or using git-lfs
git lfs install
git clone https://huggingface.co/Qwen/Qwen3.5-27B-AWQ
```

Verify the model files are present:
```bash
ls /home/yaya/models/Qwen3.5-27B-AWQ/
# Should contain: config.json, tokenizer.json, model-*.safetensors, etc.
```

## Step 3: Run Setup

The automated setup script handles everything:

```bash
cd yaya_platform
./infra/scripts/setup.sh
```

This will:
1. Check all prerequisites
2. Generate `.env` with secure random secrets
3. Initialize git submodules
4. Pull/build all Docker images
5. Start all services
6. Wait for health checks
7. Create MinIO buckets
8. Print a status summary

### Manual Setup (if you prefer)

```bash
cd infra/docker

# Copy and edit environment
cp .env.example .env
# Edit .env — replace all 'changeme' values with real secrets

# Pull images
docker compose --env-file .env pull

# Build custom images (whisper, erpnext-mcp)
docker compose --env-file .env build

# Start everything
docker compose --env-file .env up -d

# Check status
docker compose --env-file .env ps
```

## Step 4: Verify Services

### Check all containers are running

```bash
cd infra/docker
docker compose --env-file .env ps
```

Expected output: all services should show `Up` or `Up (healthy)`.

### Test individual services

```bash
# PostgreSQL
docker compose exec postgres psql -U yaya -c "SELECT version();"

# Redis
docker compose exec redis redis-cli ping
# Expected: PONG

# vLLM (may take a few minutes to load the model)
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# vLLM inference test
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep LLM_API_KEY .env | cut -d= -f2)" \
  -d '{
    "model": "qwen3.5-27b",
    "messages": [{"role": "user", "content": "Hola, ¿cómo estás?"}],
    "max_tokens": 100
  }'

# Whisper
curl http://localhost:9100/health
# Expected: {"status":"ok","model":"large-v3-turbo"}

# Lago API
curl http://localhost:3001/health
# Expected: {"status":"ok"}

# Supabase REST
curl http://localhost:54321/
# Expected: PostgREST response

# MinIO
curl http://localhost:9000/minio/health/live
```

## Step 5: Configure Lago Billing

1. Open Lago UI at `http://c.yaya.sh:8080`
2. Create your admin account (first signup)
3. Configure:
   - Organization name
   - Default currency (PEN)
   - Webhook endpoint (for payment notifications)
4. Create billing plans for your business tiers

## Step 6: Configure Supabase CRM

1. Open Supabase Studio at `http://c.yaya.sh:54323`
2. The Atomic CRM schema is auto-configured
3. Create initial admin user via the Auth section
4. Verify tables: contacts, companies, deals, activities

## Step 7: Deploy a Client

Use the deployment script to onboard a new business:

```bash
./infra/scripts/deploy-client.sh \
  --name "Tienda Maria" \
  --whatsapp "+51938438401" \
  --currency PEN \
  --yape-number "938438401" \
  --yape-name "Maria Lopez"
```

This creates:
- Isolated database schema
- NemoClaw security policy
- SOUL.md agent personality
- Configured skills
- Lago billing customer

See `clients/<slug>/` for the generated configuration.

## Step 8: Connect OpenClaw

Configure OpenClaw to use the Yaya Platform services:

```yaml
# openclaw.yaml
agent:
  llm:
    provider: openai-compatible
    base_url: http://localhost:8000/v1
    api_key: ${LLM_API_KEY}
    model: qwen3.5-27b

  whisper:
    url: http://localhost:9100

  mcp_servers:
    - name: erpnext-mcp
      command: node
      args: ["/app/mcp-servers/erpnext-mcp/dist/index.js"]

    - name: postgres-mcp
      command: postgres-mcp
      args: ["--database-uri", "${DATABASE_URI}"]

    - name: crm-mcp
      command: node
      args: ["/app/mcp-servers/crm-mcp/dist/index.js"]

    - name: lago-mcp
      command: node
      args: ["/app/mcp-servers/lago-mcp/dist/index.js"]

    - name: payments-mcp
      command: node
      args: ["/app/mcp-servers/payments-mcp/dist/index.js"]

  security:
    policy: /app/infra/nemoclaw/policy.yaml

  skills:
    directory: /app/skills
```

## Backups

### Automated Backups

Set up a daily cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/yaya_platform/infra/scripts/backup.sh /path/to/backup/storage >> /var/log/yaya-backup.log 2>&1
```

### Manual Backup

```bash
./infra/scripts/backup.sh [optional-backup-dir]
```

### Restore from Backup

```bash
# Extract backup
tar -xzf backups/yaya_backup_20260320_020000.tar.gz

# Restore databases
docker compose exec -T postgres pg_restore -U yaya -d yaya < 20260320_020000/yaya.dump
docker compose exec -T postgres pg_restore -U yaya -d lago_db < 20260320_020000/lago_db.dump

# Restore MinIO data
mc mirror 20260320_020000/minio/media yaya/media
mc mirror 20260320_020000/minio/lago yaya/lago
```

## Monitoring

### Container Logs

```bash
cd infra/docker

# All services
docker compose --env-file .env logs -f

# Specific service
docker compose --env-file .env logs -f vllm
docker compose --env-file .env logs -f lago-api
docker compose --env-file .env logs -f whisper
```

### Service Dashboards

| Service         | URL                          | Purpose               |
|----------------|------------------------------|----------------------|
| Lago UI        | http://c.yaya.sh:8080        | Billing management   |
| Supabase Studio| http://c.yaya.sh:54323       | CRM database admin   |
| MinIO Console  | http://c.yaya.sh:9001        | Object storage admin |
| vLLM Metrics   | http://c.yaya.sh:8000/metrics| LLM performance      |

### Health Check Endpoints

```bash
# Quick health check of all services
for svc in "8000/health" "9100/health" "3001/health" "54321/" "9000/minio/health/live"; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:$svc" 2>/dev/null || echo "DOWN")
  echo "$svc: $status"
done
```

## Troubleshooting

### vLLM won't start
- Check GPU memory: `nvidia-smi` — need 2x GPUs with enough VRAM
- Check model path: `ls $MODEL_PATH` — model files must exist
- Check logs: `docker compose logs vllm`
- If OOM, reduce `--gpu-memory-utilization` from 0.85 to 0.75

### Lago migrations fail
- Ensure PostgreSQL is healthy first
- Check `LAGO_SECRET_KEY_BASE` is set
- Run migrations manually: `docker compose exec lago-api bundle exec rails db:migrate`

### Supabase auth not working
- Verify `SUPABASE_JWT_SECRET` is at least 32 characters
- Check GoTrue logs: `docker compose logs supabase-auth`
- Ensure `supabase-db` is healthy before auth starts

### Database connection refused
- Wait for healthcheck: `docker compose exec postgres pg_isready`
- Check init script errors: `docker compose logs postgres`
- Verify credentials match between `.env` and `init-db.sql`

## Updating

```bash
cd yaya_platform

# Pull latest code
git pull --recurse-submodules

# Rebuild custom images
cd infra/docker
docker compose --env-file .env build

# Restart with new images
docker compose --env-file .env up -d

# Check everything is healthy
docker compose --env-file .env ps
```

## Security Considerations

- All service ports bind to `localhost` only in production — use a reverse proxy (nginx/caddy) for external access
- The `.env` file contains secrets — never commit it. It's in `.gitignore`
- NemoClaw policy blocks all internet access — the agent cannot exfiltrate data
- Each client gets an isolated database schema — no cross-client data access
- PII stripping is enabled in the inference pipeline
- Backups should be encrypted at rest in production
