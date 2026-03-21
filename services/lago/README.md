# Lago — Usage-Based Billing

Slim Docker wrapper for [Lago](https://www.getlago.com/), the open-source billing platform.

## Quick start

```bash
cp .env.example .env
# Fill in SECRET_KEY_BASE and encryption keys
docker compose up -d
# API at http://localhost:3002, Frontend at http://localhost:8080
```

## Upstream

- **Images:** `getlago/api:v1.44.0`, `getlago/front:v1.44.0`, `getlago/lago-gotenberg:7.8.2`
- **Source:** https://github.com/getlago/lago
- **Docs:** https://docs.getlago.com/

## Why slim?

We use Lago as a pre-built service. The full source repo (19MB with Rails API + React frontend) was removed — we only need the Docker images + our env config.
