# InvoiceShelf — Invoice Management

Slim Docker wrapper for [InvoiceShelf](https://invoiceshelf.com/), the open-source invoicing platform.

## Quick start

```bash
cp .env.example .env
# Generate APP_KEY
docker compose up -d
# Access at http://localhost:8090
```

## Upstream

- **Image:** `serversideup/php:8.3-fpm-nginx-alpine` (base runtime)
- **Source:** https://github.com/InvoiceShelf/InvoiceShelf
- **Docs:** https://invoiceshelf.com/docs

## Note

InvoiceShelf may be superseded by apisunat.pe for Peru-specific e-invoicing (SUNAT compliance). This service is kept for general invoice management needs outside Peru.

## Why slim?

We use InvoiceShelf as a pre-built service. The full Laravel source repo (16MB) was removed — we only need the Docker image + our env config.
