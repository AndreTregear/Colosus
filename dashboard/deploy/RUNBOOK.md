# agente.ceo — Launch Runbook

Two machines. One launch.

| Machine | Role | Public? |
|---|---|---|
| **Lambda** (`100.81.36.110` on tailnet) | yayapay-server + wired Yape phone + shared Postgres | No — reachable via Tailscale only |
| **Workstation** (`home` / `ssh.campusgenie.ai`, `100.94.157.101` on tailnet) | agente-ceo Next.js, Caddy ingress, yaya-business Better Auth | Yes — `agente.ceo`, `app.agente.ceo` |

---

## Prereqs

- Tailscale up on both boxes, same tailnet, MagicDNS enabled so `lambda` resolves from the workstation.
- Cloudflare DNS: `agente.ceo` and `app.agente.ceo` A records pointing at the workstation's public IP. **DNS-only (grey cloud)** during first cert issuance; flip to proxied after.
- RUC `10729306911` active on Nubefact. API URL + token from *Cuenta → API Endpoint Information*.

---

## Step 1 — Lambda: yayapay-server production mode

```bash
# On Lambda
cd /home/yaya/Project/yayapay-server

# Build release (already done via rustls switch)
cargo build --release

# Stop running debug process
pkill -f 'target/debug/yayapay-server' || true

# Install systemd unit
sudo mkdir -p /var/log/yayapay-server
sudo chown yaya:yaya /var/log/yayapay-server
sudo cp /home/yaya/agente-ceo/deploy/systemd/yayapay-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now yayapay-server

# Verify
systemctl status yayapay-server
curl -sf http://localhost:3000/health
```

On first boot, sqlx will run migrations 001–006 and create `webhook_endpoints` + `webhook_deliveries`.

---

## Step 2 — Lambda: real merchant + API key

```bash
# Read current admin-auth header. The admin routes use the same
# api_key_middleware — pick any existing key from ak_test or ak_bootstrap
# one time, then rotate them after creating the real one.
ADMIN_KEY="sk_live_…"   # from earlier bootstrap

# 2a. Update Yaya HQ merchant with real Yape phone
docker exec -i yayapay-server-db-1 psql -U yayapay -d yayapay <<SQL
UPDATE merchants
   SET yape_phone = '51XXXXXXXXX',   -- real number on the wired phone
       name       = 'Agente CEO',    -- or whatever appears on boletas
       phone      = '51XXXXXXXXX'
 WHERE id = 'a0000000-0000-0000-0000-000000000001';
SQL

# 2b. Create a fresh API key for agente-ceo
curl -sS -X POST http://localhost:3000/api/v1/admin/merchants/a0000000-0000-0000-0000-000000000001/api_keys \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"agente-ceo-prod"}' | tee /tmp/agente-ceo-key.json

# Copy the `key` field → YAYAPAY_API_KEY in agente-ceo .env.local

# 2c. Register an outbound webhook endpoint for agente-ceo
curl -sS -X POST http://localhost:3000/api/v1/merchant/webhooks \
  -H "Authorization: Bearer <the new agente-ceo key>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.agente.ceo/api/webhooks/yayapay",
    "enabled_events": [
      "payment_intent.created",
      "payment_intent.succeeded",
      "payment_intent.canceled",
      "payment_intent.expired"
    ],
    "description": "agente-ceo subscription lifecycle"
  }' | tee /tmp/agente-ceo-webhook.json

# Copy the `secret` field → YAYAPAY_WEBHOOK_SECRET in agente-ceo .env.local

# 2d. Rotate / disable the leaked test keys
docker exec -i yayapay-server-db-1 psql -U yayapay -d yayapay <<SQL
UPDATE api_keys SET active = false
 WHERE id IN ('ak_test','ak_bootstrap');
SQL
```

---

## Step 3 — Workstation: agente-ceo env + build

```bash
# On workstation
cd ~/agente-ceo

# Pull the new code (deployed from Lambda staging)
# — handled by the sync script below

cp .env.local.example .env.local
# Edit .env.local:
#   YAYAPAY_BASE_URL=http://lambda:3000
#   YAYAPAY_API_KEY=<from step 2b>
#   YAYAPAY_WEBHOOK_SECRET=<from step 2c>
#   NUBEFACT_API_URL=<from nubefact.com>
#   NUBEFACT_API_TOKEN=<from nubefact.com>
#   ISSUER_RUC=10729306911
#   ISSUER_RAZON_SOCIAL=<your registered razón social>
#   ISSUER_DIRECCION=<your fiscal address>

# Apply the billing schema migration
PGPASSWORD=yaya psql -h 127.0.0.1 -U yaya -d yaya_business \
  -f db/migrations/001_agente_ceo_billing.sql

# Install deps + build with standalone output
# next.config.ts must have `output: 'standalone'` — already set.
npm install
npm run build
```

---

## Step 4 — Workstation: pm2 + Caddy

```bash
# 4a. pm2 — add agente-ceo to the main ecosystem
# Option A: edit ~/yaya-ecosystem.config.cjs and add the agente-ceo block
# from deploy/pm2.ecosystem.cjs
# Option B: run standalone
pm2 startOrReload deploy/pm2.ecosystem.cjs
pm2 save

# Reset the stale 332k restart counter
pm2 reset agente-ceo

# 4b. Caddy — add the new site block
sudo cp deploy/Caddyfile.agente-ceo /etc/caddy/Caddyfile.d/agente-ceo.caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 4c. Verify
curl -If https://app.agente.ceo/
curl -If https://agente.ceo/
```

---

## Step 5 — End-to-end test

1. Open `https://app.agente.ceo/register` in a clean browser. Create a test account.
2. You should be redirected into `/chat`, but the first message hits `/api/chat` which now returns 402 with `checkout_url: /settings/billing`. The UI should redirect or show the paywall.
3. Go to `https://app.agente.ceo/settings/billing`. Pick **Monthly (S/ 49.00)**.
4. The QR page appears with countdown. Open Yape on the wired phone, scan the QR, confirm the payment.
5. Within ~1s the matcher should mark the transaction confirmed. The wired phone's notification listener pushes to yayapay-server, which dispatches the webhook to `app.agente.ceo/api/webhooks/yayapay`. agente-ceo's handler verifies the HMAC, flips the subscription active, and calls Nubefact to issue a boleta.
6. The `/settings/billing` page polls `/api/billing/status?intent_id=…` every 2s and flips to the "¡Pago recibido!" state with the boleta PDF link.
7. Click "Ir al chat" and send a real message — it should stream.

### Failure modes to verify

- **Wrong amount**: Yape a different amount. Verify it stays pending and eventually expires.
- **Expired intent**: Wait 10 minutes. `status` should flip to `expired`. UI shows "esta orden expiró".
- **Replay webhook**: re-POST the webhook body with same signature. Should no-op (`replayed: true`).
- **Nubefact down**: stub `NUBEFACT_API_URL` to a bogus value. Payment should still activate the subscription; boleta retry is out of band (add to task list).

---

## Step 6 — Observability (post-launch)

- Uptime Kuma on workstation, monitors: `https://agente.ceo`, `https://app.agente.ceo/api/billing/me`, `http://lambda:3000/health`, local Postgres.
- Alert channel: WhatsApp via the existing yaya-business Baileys gateway.
- Put `hpc-tunnel.sh` under systemd on the workstation.

---

## Sync script (Lambda → workstation)

From Lambda, push the staged changes to the workstation:

```bash
cd /tmp/agente-ceo-staging
tar -cf - --exclude=node_modules --exclude=.next --exclude=.git . \
  | ssh ssh.campusgenie.ai 'tar -xf - -C agente-ceo/'
```

Then on the workstation, `npm install && npm run build && pm2 reload agente-ceo`.
