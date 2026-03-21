# Karrio — Universal Shipping API

Slim Docker wrapper for [Karrio](https://karrio.io/), the open-source multi-carrier shipping API.

## Quick start

```bash
cp .env.example .env
docker compose up -d
# API at http://localhost:5002, Dashboard at http://localhost:3005
```

## Upstream

- **Images:** `karrio.docker.scarf.sh/karrio/server`, `karrio.docker.scarf.sh/karrio/dashboard`
- **Source:** https://github.com/karrioapi/karrio
- **Docs:** https://docs.karrio.io/

## Why slim?

We use Karrio as a pre-built service. The full monorepo (200MB with 30+ carrier integrations) was removed — we only need the Docker images + our env config.
