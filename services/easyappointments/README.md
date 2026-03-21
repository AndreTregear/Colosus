# Easy!Appointments — Appointment Scheduling

Slim Docker wrapper for [Easy!Appointments](https://easyappointments.org/), the open-source appointment scheduler.

## Quick start

```bash
cp .env.example .env
docker compose up -d
# Access at http://localhost:8060
```

## Upstream

- **Image:** `alextselegidis/easyappointments:latest`
- **Source:** https://github.com/alextselegidis/easyappointments
- **Docs:** https://easyappointments.org/docs/

## Note

Easy!Appointments provides a standalone scheduling UI. For WhatsApp-native scheduling, the platform uses appointments-mcp + Cal.com bridge. This service is kept as a fallback UI for businesses that prefer a web interface.

## Why slim?

We use Easy!Appointments as a pre-built service. The full PHP source repo (11MB) was removed — we only need the Docker image + our env config.
