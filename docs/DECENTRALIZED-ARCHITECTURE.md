# Yaya Decentralized Architecture — YayaCoin Vision

> **Status**: Brainstorm / RFC  
> **Date**: 2026-04-04  
> **Context**: 4x B200 GPUs running Qwen3-Omni via vLLM-Omni on HiPerGator, serving WhatsApp voice-native AI for LatAm micro-businesses. How do we make this scale horizontally, decentralized, with token incentives?

---

## The Problem

Right now we have a centralized setup:
- 4 GPUs on one SLURM node (c0906a-s15) running 4 vLLM-Omni instances (ports 8080-8083)
- One gateway server routing WhatsApp traffic
- One database per vertical (platform + health)

This doesn't scale to millions of users, and it creates a single point of failure. It also means **we** pay for all the compute.

## The Vision: Decentralized AI Voice Network

**Anyone can contribute GPU compute. Anyone can use the network. YayaCoin flows between them.**

```
┌─────────────────────────────────────────────────────────────────┐
│                     YAYA NETWORK                                 │
│                                                                   │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│   │ Worker A │    │ Worker B │    │ Worker C │  ← GPU providers  │
│   │ 4xA100   │    │ 2xH100  │    │ 1xB200   │                  │
│   │ Lima     │    │ Bogotá   │    │ UF HPC   │                  │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                  │
│        │               │               │                         │
│        └───────────┬───┴───────────────┘                         │
│                    │                                              │
│            ┌───────▼────────┐                                    │
│            │  YAYA ROUTER   │  ← Smart load balancer              │
│            │  (gossip mesh) │    latency + capacity + reputation   │
│            └───────┬────────┘                                    │
│                    │                                              │
│   ┌────────────────┼────────────────┐                            │
│   │                │                │                             │
│   ▼                ▼                ▼                             │
│ ┌──────┐    ┌──────────┐    ┌───────────┐                       │
│ │ Yaya │    │ Yaya     │    │ Yaya      │  ← App verticals      │
│ │ Biz  │    │ Health   │    │ Education │                        │
│ └──────┘    └──────────┘    └───────────┘                        │
│                                                                   │
│                    💰 YAYA COIN                                   │
│   Users pay tokens → Router → Workers earn tokens                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 1: Worker Network (GPU Providers)

**Who**: Anyone with GPUs — university HPC clusters, cloud providers, crypto miners with idle capacity, home lab enthusiasts with consumer GPUs.

**What they run**: 
- Standard vLLM-Omni serving Qwen3-Omni (or any supported model)
- A **Yaya Worker Agent** sidecar that:
  - Registers with the mesh (gossip protocol or DHT)
  - Reports capacity (model loaded, GPU memory, queue depth, latency)
  - Accepts jobs, returns results
  - Tracks token earnings

**Requirements**:
- OpenAI-compatible API (vLLM-Omni provides this)
- Minimum quality: response latency < 5s for text, < 10s for audio
- Uptime SLA (higher uptime = higher reputation = more jobs)

**Onboarding**:
```bash
# Any GPU owner can join
pip install yaya-worker
yaya-worker register --gpu-count 4 --model qwen3-omni
yaya-worker start --wallet 0x...
```

### Layer 2: Yaya Router (Decentralized Load Balancer)

The router is the **brain** — it decides which worker handles each request.

**Routing criteria** (weighted score):
1. **Latency** — geographic proximity (Lima user → Lima worker)
2. **Capacity** — current queue depth, GPU utilization
3. **Reputation** — historical reliability, quality scores
4. **Cost** — worker's ask price in YAYA tokens
5. **Specialization** — some workers may be fine-tuned for health, business, education

**Implementation options**:
- **Phase 1**: Centralized router (simple, fast to ship) — just an nginx/HAProxy with health checks
- **Phase 2**: Federated routers (regional, each managing local workers)
- **Phase 3**: Fully decentralized (libp2p gossip, DHT-based discovery, on-chain reputation)

**Smart routing for audio**:
- Voice messages need low latency → prefer geographically close workers
- Text-only can be routed to any worker
- Tool calls may need multiple round-trips → stick to one worker per session

### Layer 3: Application Layer (Verticals)

Open source apps that consume the network:
- **Yaya Business** (yaya_platform) — micro-business assistant
- **Yaya Health** (yaya_health) — community health worker
- **Yaya Education** — tutoring and educational content
- **Third-party apps** — anyone can build on the API

Each app just needs a YAYA wallet and the router endpoint.

---

## YayaCoin Token Economics

### Token Flow

```
User sends voice message on WhatsApp
    → App server (Yaya Business) receives it
    → App creates inference job + attaches YAYA payment
    → Router finds best worker
    → Worker processes (audio in → text + audio out)
    → Worker gets paid YAYA tokens
    → Audio response sent back to WhatsApp user
```

### Earning YAYA

| Actor | How they earn |
|---|---|
| **GPU Workers** | Process inference jobs (per-token pricing) |
| **App Builders** | Revenue share from users they onboard |
| **Data Contributors** | Provide training data (voice, translations) |
| **Quality Validators** | Rate response quality (human feedback) |
| **Network Operators** | Run router nodes |

### Spending YAYA

| Actor | How they spend |
|---|---|
| **App Users** | Pay for AI inference (directly or via subscription) |
| **Businesses** | Pay for their customers' AI interactions |
| **App Builders** | Pay for inference on behalf of users (freemium model) |

### Pricing Model

```
Base price per request:
  - Text in → Text out:     1 YAYA
  - Audio in → Text out:    3 YAYA (STT + inference)
  - Text in → Audio out:    3 YAYA (inference + TTS)
  - Audio in → Audio out:   5 YAYA (full omni pipeline)
  - + Tool calls:           +0.5 YAYA per tool call
  
Workers set their own multiplier (e.g., 1.0x to 3.0x)
Premium workers (lower latency, better GPU) can charge more
```

### Anti-Abuse

- **Proof of GPU**: Workers must demonstrate GPU capability (benchmark on registration)
- **Stake**: Workers stake YAYA tokens — slashed for bad behavior (fake results, downtime)
- **Quality checks**: Random jobs are verified by multiple workers (consensus)
- **Rate limiting**: Users and apps have reputation-based rate limits

---

## Horizontal Scaling Design

### Current: Single Node, 4 GPUs

```
WhatsApp → Gateway → [GPU0:8080, GPU1:8081, GPU2:8082, GPU3:8083]
```

### Phase 1: Multi-Node with Central Router

Add more compute endpoints behind a load balancer:

```yaml
# yaya-router config
workers:
  - url: http://hpc-node1:8080  # HiPerGator
    weight: 4
    models: [qwen3-omni]
  - url: http://hpc-node1:8081
    weight: 4
  - url: http://hpc-node1:8082
    weight: 4
  - url: http://hpc-node1:8083
    weight: 4
  - url: http://cloud-gpu1.yaya.sh:8080  # Cloud worker
    weight: 2
    models: [qwen3-omni]
  - url: http://community-worker-lima.yaya.sh:8080  # Community
    weight: 1
    models: [qwen3-omni]

routing:
  strategy: weighted-least-connections
  health_check_interval: 10s
  max_queue_depth: 50
  audio_prefer_low_latency: true
```

**Implementation**: Simple Node.js/Go proxy service. Can ship this week.

### Phase 2: Federated Routing

Regional routers that know about local workers:

```
[Lima Router] ←→ [Bogotá Router] ←→ [Mexico Router]
     ↓                  ↓                   ↓
 Lima Workers      Bogotá Workers     Mexico Workers
```

Each router:
- Manages local worker registration
- Shares capacity info with peer routers via gossip
- Routes locally when possible, cross-region when needed
- Maintains local reputation scores

### Phase 3: Fully Decentralized

- **libp2p** for peer discovery and gossip
- **IPFS/Filecoin** for model weight distribution
- **Smart contracts** for payment settlement and reputation
- **Zero-knowledge proofs** for privacy-preserving quality verification
- Workers self-register, users self-route (client-side routing)

---

## Open Source Strategy

### What's Open Source (MIT/Apache)

- **yaya_core** — Shared libraries (omni client, bot framework, crypto)
- **yaya_platform** — Business assistant app
- **yaya_health** — Health assistant app
- **yaya-worker** — GPU worker agent
- **yaya-router** — Load balancer / routing mesh
- **vLLM-Omni** — Already OSS (Apache 2.0)
- **Qwen3-Omni** — Model weights are open

### What Could Be Protocol-Level

- **Yaya Network Protocol** — How workers register, advertise, and get paid
- **Quality Verification** — How results are validated
- **Token Contract** — ERC-20 or Solana SPL token

### What Stays Proprietary (Optional)

- Managed hosting / SaaS offering ("Yaya Cloud")
- Premium fine-tuned models for specific verticals
- Enterprise support and SLAs

---

## Technical Components to Build

### Immediate (This Week)

1. **yaya-router**: Simple reverse proxy with:
   - Round-robin / least-connections across the 4 GPU instances
   - Health checks (ping /v1/models every 10s)
   - Sticky sessions for multi-turn conversations
   - Request queuing with backpressure

2. **Update omni.ts**: Point to router instead of single instance

### Short Term (This Month)

3. **Worker Agent**: Sidecar that:
   - Reports GPU stats (nvidia-smi metrics)
   - Exposes readiness/liveness endpoints
   - Handles graceful drain for SLURM job preemption

4. **Multi-endpoint config**: Support multiple OMNI_API_URLs in env

### Medium Term (Pre-Launch)

5. **Token prototype**: Simple ERC-20 on Base/Arbitrum (low gas)
6. **Payment channel**: Off-chain micropayments (state channels or rollup)
7. **Worker registration**: Simple REST API for now, migrate to on-chain later
8. **Quality scoring**: Log response quality, user feedback

### Long Term (Post-Launch)

9. **Decentralized routing**: libp2p mesh
10. **Model marketplace**: Workers can serve different models
11. **Training rewards**: Users who provide voice data earn tokens
12. **Governance**: Token holders vote on protocol changes

---

## Why This Works for LatAm

1. **GPU supply**: Universities, mining rigs, cloud credits — lots of underutilized compute
2. **Demand**: 400M+ WhatsApp users in LatAm, mostly voice-first
3. **Cost**: Decentralized compute is cheaper than OpenAI API for high volume
4. **Language**: Qwen3-Omni handles Spanish/Quechua natively — no English-first bias
5. **Trust**: Open source + on-chain = verifiable, no vendor lock-in
6. **Incentives**: Miners transitioning from crypto to AI compute is already happening

---

## Comparable Projects

| Project | What they do | How Yaya differs |
|---|---|---|
| **Bittensor** | Decentralized AI training/inference | Yaya focuses on voice-native, LatAm-specific, WhatsApp delivery |
| **Akash Network** | Decentralized cloud compute | Yaya is application-layer, not just raw compute |
| **io.net** | GPU aggregation | Yaya bundles the model + app + delivery channel |
| **Render Network** | GPU rendering marketplace | Different use case (rendering vs AI inference) |
| **Gensyn** | Decentralized training | Yaya focuses on inference, not training |

**Yaya's moat**: We're not just a compute network. We're the **complete stack** — model serving + application layer + WhatsApp delivery + local language support. The token is the glue that makes it sustainable.

---

## Next Steps

1. ✅ Build the omni integration (done — all 3 repos)
2. 🔨 Build yaya-router (load balancer across 4 GPU instances)
3. 📝 Draft token economics whitepaper
4. 🏗️ Prototype worker agent sidecar
5. 🧪 Test end-to-end: WhatsApp voice → router → GPU → voice reply
6. 🪙 Deploy token contract on testnet
7. 🌍 Recruit first community GPU workers

---

*"La descentralización no es un fin en sí mismo — es la forma de construir algo que ninguna empresa puede apagar."*
