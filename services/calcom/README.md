# Cal.com — Scheduling

Slim Docker wrapper for [Cal.com](https://cal.com), the open-source scheduling platform.

## Quick start

```bash
cp .env.example .env
# Fill in NEXTAUTH_SECRET and CALENDSO_ENCRYPTION_KEY
docker compose up -d
```

## Upstream

- **Image:** `calcom.docker.scarf.sh/calcom/cal.com:latest`
- **Source:** https://github.com/calcom/cal.com
- **Docs:** https://cal.com/docs/self-hosting

## Why slim?

We use Cal.com as a pre-built service. The full source repo (339MB) was removed — we only need the Docker image + our env config. If you need to customize Cal.com source, clone the upstream repo separately.
