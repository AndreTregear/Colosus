# Atomic CRM — Contact & Deal Management

Slim Docker wrapper for [Atomic CRM](https://github.com/marmelab/atomic-crm), the React + Supabase CRM.

## Quick start

```bash
cp .env.example .env
# Fill in Supabase credentials
docker compose up -d
# Access at http://localhost:3003
```

## Upstream

- **Source:** https://github.com/marmelab/atomic-crm
- **Stack:** React 19 + TypeScript + Vite + Supabase

## Note

The CRM UI may be superseded by crm-mcp for most operations (skills interact with CRM data via MCP tools). This service is kept for the visual dashboard.

## Why slim?

We use Atomic CRM as a pre-built app. The full source repo (13MB with tests/docs) was removed — the Dockerfile clones from upstream at build time.
