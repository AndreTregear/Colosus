# Yaya Port Dictionary

Single source of truth for port allocation across the Yaya stack. Anything that listens on a TCP port goes here. **No new service may take a port without updating this file.**

Snapshot: 2026-05-02.

## Reserved bands

Each band has a single owner type. New services pick the next free port within their band; collisions are blocked at allocation, not at run time.

| Band         | Owner                                          | Exposure           | Notes |
|--------------|------------------------------------------------|--------------------|-------|
| 22           | SSH                                            | external (key)     | sshd, never stop |
| 80, 443      | nginx                                          | external           | TLS terminator + reverse proxy |
| **3000–3099** | Node/Next.js web apps (PM2)                   | external via nginx | one app per port |
| **3100–3199** | Web apps (overflow / ThinkPad replicas)       | external via nginx | a.yaya.sh / b.yaya.sh apps |
| **4000–4499** | Niche dashboards                              | external via nginx | calcom, fitness, etc. |
| **5000–5999** | Databases, queues, brokers                    | **internal only**  | postgres, redis, etc. |
| **8000–8099** | **AI services (GPU-bound)**, bearer-protected | external (Tailscale recommended) | LLM, ASR, TTS, voice agents |
| **9000–9099** | Object storage, metrics, internal tooling     | internal only      | minio, prometheus |
| **9400–9499** | **Auth / SSO**                                | external via nginx | Authentik (HTTP 9400, HTTPS 9443) |
| **18000–18999** | **Upstream-only** (always behind nginx)     | `127.0.0.1` only   | bearer-protected service upstreams |
| 51000+       | Tailscale, ephemeral                           | tailnet            | — |

## Live allocation (host: 2× A5000 box)

External (anything reachable from outside the box without nginx in front):

| Port  | Service                       | Process                               | Auth                  |
|-------|-------------------------------|---------------------------------------|-----------------------|
| 22    | SSH                           | systemd `sshd`                        | keys                  |
| 80    | nginx                         | systemd `nginx`                       | per-vhost             |
| 3000  | autobot                       | docker `yaya_business-autobot`        | session / API key     |
| 3001  | nginx (additional listener)   | systemd `nginx`                       | per-vhost             |
| 3002  | calcom                        | docker `yaya_business-calcom`         | OIDC (planned)        |
| 3003  | metabase                      | docker `yaya_business-metabase`       | OIDC (planned)        |
| 3005  | agente-ceo (live)             | PM2 `agente-ceo`                      | session               |
| 3006  | websites (static, port A)     | docker `websites` (nginx:alpine)      | none                  |
| 3010  | lago-api                      | docker `yaya_business-lago-api`       | OIDC (planned)        |
| 4400  | websites (static, port B)     | docker `websites`                     | none                  |
| 5432  | postgres                      | docker `yaya_business-postgres`       | password              |
| 6379  | redis                         | docker `yaya_business-redis`          | none (internal)       |
| **8000** | **vLLM (LLM)**             | PM2 `vllm-qwen`                       | Bearer `welcometothepresent` |
| **8001** | **Speaches (ASR REST)** via nginx | docker `speaches` (upstream 18001) | Bearer `welcometothepresent` |
| **8002** | **Kokoro (TTS)** via nginx | docker `kokoro-tts` (upstream 18002)  | Bearer `welcometothepresent` |
| **8003** | **streaming-asr (live ASR WS)** | PM2 `streaming-asr`              | Bearer `welcometothepresent` |
| 8080  | lago-front                    | docker `yaya_business-lago-front`     | session               |
| 8090  | invoiceshelf                  | docker `yaya_business-invoiceshelf`   | session               |
| 8888  | pay-yaya-sh                   | PM2 `pay-yaya-sh`                     | per-link tokens       |
| 9000  | minio (S3 API)                | docker `yaya_business-minio`          | access keys           |
| 9001  | minio (console)               | docker `yaya_business-minio`          | password              |
| **9400** | **Authentik (HTTP)** _planned_ | docker `authentik-server` (revival) | session               |
| **9443** | **Authentik (HTTPS)** _planned_| docker `authentik-server` (revival) | session               |

Internal (`127.0.0.1` only — fronted by nginx or used by sibling services):

| Port   | Service                        | Notes                              |
|--------|--------------------------------|------------------------------------|
| 18001  | Speaches upstream              | bound to 127.0.0.1, fronted on 8001|
| 18002  | Kokoro upstream                | bound to 127.0.0.1, fronted on 8002|
| 18080–18083 | HPC tunnel (B200 GPUs)    | ssh tunnels to hpg.rc.ufl.edu      |

## Decommissioned / freed

| Port | Was         | Status                                                    |
|------|-------------|-----------------------------------------------------------|
| 9090 | Authentik (planned), then briefly squatted by streaming-asr | **Free.** Authentik will revive on 9400; streaming-asr moved to 8003. |
| 9091 | `agent.py` (live voice orchestrator) | **Free.** Killed 2026-05-02 — no callers. File parked at `/home/yaya/agent.py.disabled-2026-05-02`. |
| 9100, 9200, 9300, 9400 (old) | early voice prototypes | superseded by 8001/8002/8003. |

## Allocation rules

1. **One file, one truth.** Update this table _before_ taking a new port. PRs that bind a port without a row here get blocked.
2. **AI services live in 8000–8099.** No exceptions. New voice/agent endpoints go here.
3. **Anything that ends up in front of nginx must bind 127.0.0.1 only**, in the 18000–18999 band. The public-facing port is reserved separately.
4. **Bearer-protected services share the token** (`welcometothepresent`) for now. Per-tenant keys come when we charge real money.
5. **Cross-machine traffic** (Peru app server ↔ lab GPU box) must traverse Tailscale or a public TLS endpoint. Plain HTTP across the public internet leaks the bearer.
6. **SSO sits in front of every customer-facing app.** Once Authentik is live (9400), each app's nginx vhost gets `auth_request /outpost.goauthentik.io/auth/nginx;` so login is unified.

## How services pick up these defaults

- TS / Node: `import { llmConfig, asrConfig, asrStreamConfig, ttsConfig } from "@yaya/clients/config"` — env-driven with the defaults baked in.
- Python: read from env (`YAYA_LLM_URL`, `YAYA_ASR_URL`, `YAYA_ASR_WS_URL`, `YAYA_TTS_URL`).
- Shell / docker-compose: load from a single `.env` file at the repo root.

## Related docs

- [`INFRA.md`](INFRA.md) — what's running, GPU layout, service-by-service endpoint reference.
- [`packages/yaya-clients/README.md`](packages/yaya-clients/README.md) — composable TS clients reading these ports.
