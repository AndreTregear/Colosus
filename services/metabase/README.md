# Metabase — Business Intelligence

Slim Docker wrapper for [Metabase](https://www.metabase.com/), the open-source BI platform.

## Quick start

```bash
cp .env.example .env
docker compose up -d
# Access at http://localhost:3001
```

## Upstream

- **Image:** `metabase/metabase:latest`
- **Source:** https://github.com/metabase/metabase
- **Docs:** https://www.metabase.com/docs/latest/

## Why slim?

We use Metabase as a pre-built service. The full source repo (319MB of Clojure/JS) was removed — we only need the Docker image + our env config.
