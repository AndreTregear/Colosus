# WhatsApp Voice AI Integration Architecture: Reference Design for Yaya Platform
## Technical Architecture for Voice-First Business Management via WhatsApp Cloud API

**Date:** March 22, 2026  
**Author:** Yaya Research Division  
**Version:** 1.0  
**Classification:** Technical Architecture — Engineering Reference  

---

## Executive Summary

Building a voice-first AI system on WhatsApp is fundamentally an architecture problem, not a model problem. Most projects fail not because their AI is weak, but because they discover WhatsApp Business API constraints mid-build. This document provides a complete reference architecture for Yaya Platform's voice processing pipeline — from voice note receipt through transcription, NLU, business logic, and response — designed around the specific constraints of Meta's WhatsApp Cloud API, the latency requirements of conversational business management, and Peruvian data protection compliance.

The architecture separates policy-facing components (WhatsApp API interaction) from AI components (STT, NLU, LLM) from business logic (inventory, invoicing, scheduling), enabling each layer to evolve independently. The design prioritizes: (1) sub-5-second response for common operations, (2) zero cross-border audio transfer, (3) graceful degradation under failure, and (4) cost optimization for high-volume, low-ARPU SaaS.

---

## 1. WhatsApp Business API: Fundamental Constraints

### 1.1 Voice Notes Are Not Streaming Audio

WhatsApp is **not** a real-time voice channel. There is no streaming audio API. Voice notes arrive as discrete media files:

- User records and sends a voice note (OGG/Opus format)
- WhatsApp delivers a webhook notification with a `media_id`
- Backend calls Meta's media API to download the audio file via a temporary URL
- The entire file must be downloaded before processing begins
- Processing is inherently batch, not stream-based

**Critical implication:** Yaya cannot start transcription until the full voice note is downloaded. Every second of audio recording adds to total latency. The architecture must be designed for asynchronous, media-centric workflows.

### 1.2 Key API Limitations

| Constraint | Detail | Impact |
|---|---|---|
| Audio format | OGG/Opus (from mobile), various codecs | STT must handle OGG/Opus natively or convert |
| File size limit | 16 MB per media message | ~10–15 minutes of voice at typical quality |
| Media URL expiry | Temporary URLs, limited validity | Must download immediately on webhook receipt |
| No streaming | Discrete messages only | Cannot build real-time voice call experience |
| 24-hour window | Free replies within 24h of user message | Templates needed for proactive messages after window |
| Rate limits | Per-phone-number and per-account limits | Queue and back-pressure handling required |
| Pricing | Per-conversation pricing model | Efficient flows reduce cost per user |
| E2E encryption | Decrypted only via Business API | Cannot intercept or process in-transit |

### 1.3 Session Window Rules

Meta enforces a 24-hour customer care window:
- After user sends any message (text/voice), Yaya can reply freely for 24 hours
- After 24 hours, only pre-approved message templates can be sent
- Templates must comply with Meta's content policy (no general AI assistants)
- Business-initiated conversations (templates) are priced differently

**For Yaya:** The evening business summary (a key retention feature) must be sent within 24 hours of the last user message, OR use an approved template. Since Yaya users send daily voice notes, the window typically stays open. But the architecture must handle the edge case of inactive users.

---

## 2. Reference Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    WhatsApp Users                        │
│              (voice notes, text, images)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS webhooks
                       ▼
┌──────────────────────────────────────────────────────────┐
│              TRANSPORT LAYER (Policy-Facing)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Webhook    │  │   Media      │  │   Message     │  │
│  │   Receiver   │  │   Pipeline   │  │   Sender      │  │
│  │  (validate   │  │  (download,  │  │  (text, audio,│  │
│  │   signatures)│  │   store,     │  │   templates)  │  │
│  │              │  │   track TTL) │  │               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────▲───────┘  │
│         │                 │                   │          │
└─────────┼─────────────────┼───────────────────┼──────────┘
          │                 │                   │
          ▼                 ▼                   │
┌──────────────────────────────────────────────────────────┐
│               ORCHESTRATION LAYER                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │            Message Router / Orchestrator           │    │
│  │   • Classify message type (voice/text/image)      │    │
│  │   • Route to appropriate pipeline                 │    │
│  │   • Manage conversation state                     │    │
│  │   • Handle errors, retries, timeouts              │    │
│  │   • Track latency per stage                       │    │
│  └──────────┬──────────────┬──────────────┬──────────┘    │
│             │              │              │               │
└─────────────┼──────────────┼──────────────┼───────────────┘
              │              │              │
    ┌─────────▼──────┐ ┌────▼─────┐ ┌─────▼──────────┐
    │  AI LAYER      │ │ BUSINESS │ │ RESPONSE       │
    │                │ │ LOGIC    │ │ FORMATTER      │
    │ • STT (Whisper)│ │ LAYER    │ │                │
    │ • NLU/Intent   │ │          │ │ • Text reply   │
    │ • Entity       │ │ • Invent.│ │ • TTS audio    │
    │   extraction   │ │ • Invoice│ │ • Structured   │
    │ • LLM reasoning│ │ • Sched. │ │   list/buttons │
    │ • Confidence   │ │ • Analyt.│ │ • Error msgs   │
    │   scoring      │ │ • Payments│ │               │
    └────────────────┘ └──────────┘ └────────────────┘
                            │
                            ▼
    ┌────────────────────────────────────────────────┐
    │              DATA LAYER                         │
    │  • PostgreSQL (business data, transactions)     │
    │  • Redis (session state, caching)               │
    │  • S3-compatible (temporary media storage)      │
    │  • Audit log (compliance, traceability)         │
    └────────────────────────────────────────────────┘
```

### 2.2 Voice Note Processing Pipeline (Detailed Flow)

The complete lifecycle of a voice note:

```
1. USER RECORDS & SENDS
   └─ WhatsApp compresses audio (OGG/Opus, ~10KB/sec)
   └─ Typical voice note: 5–15 seconds → 50–150KB

2. WEBHOOK RECEIPT (T+0ms)
   └─ WhatsApp POSTs webhook to Yaya's endpoint
   └─ Validate signature (HMAC SHA256)
   └─ Extract: media_id, phone_number, timestamp, message_id
   └─ Send 200 OK immediately (critical: WhatsApp expects fast ack)
   └─ Enqueue for async processing

3. MEDIA DOWNLOAD (T+100–500ms)
   └─ Call GET /v18.0/{media_id} to get download URL
   └─ Download audio file from temporary URL
   └─ Store temporarily in local/in-memory storage
   └─ Log: media_id, size, download_time

4. SPEECH-TO-TEXT (T+500–2000ms)
   └─ Send audio to self-hosted Whisper v3
   └─ Model: whisper-large-v3 (or faster medium for <10s clips)
   └─ Language hint: es (Spanish)
   └─ Output: transcription text + language confidence + segments
   └─ DELETE AUDIO FILE immediately after transcription
   └─ Log: transcription_time, word_count, confidence

5. NLU / INTENT EXTRACTION (T+2000–2500ms)
   └─ Parse transcription for:
       • Intent (sale, expense, appointment, query, inventory)
       • Entities (amount, product, client name, date/time)
       • Context (continuation of previous conversation?)
   └─ Options:
       a) Rule-based + regex for common patterns (fastest, cheapest)
       b) Small local model (Qwen 27B on c.yaya.sh) for complex cases
       c) Cloud LLM (Claude/GPT) for ambiguous cases (fallback)
   └─ Confidence scoring: if <threshold, ask for clarification

6. BUSINESS LOGIC (T+2500–3500ms)
   └─ Based on intent + entities:
       • SALE: Create transaction record, update inventory, update client
       • EXPENSE: Record expense, categorize
       • APPOINTMENT: Check availability, create/confirm booking
       • QUERY: Retrieve data (inventory level, daily sales, client history)
       • INVOICE: Generate SUNAT/DIAN-compliant document
   └─ All operations are transactional (ACID on PostgreSQL)

7. RESPONSE GENERATION (T+3500–4500ms)
   └─ Format response based on operation result
   └─ Options:
       a) Text message (default, fastest, cheapest)
       b) Text + structured data (buttons, lists for selection)
       c) TTS audio reply (for key summaries, optional)
   └─ Personalize: use business owner's name, reference context

8. MESSAGE SEND (T+4500–5000ms)
   └─ POST to WhatsApp Cloud API /messages endpoint
   └─ Include: text body, optional media, message_id reference
   └─ Log: response_time, message_id, delivery_status
```

**Total target latency: 3–5 seconds** for common operations (sale recording, inventory query). Complex operations (invoice generation, multi-step scheduling) may take 5–8 seconds.

### 2.3 Latency Budget

| Stage | Target | Notes |
|---|---|---|
| Webhook receipt + ack | <50ms | Must be near-instant |
| Media download | 100–400ms | Depends on file size, Meta API latency |
| STT (Whisper) | 500–1500ms | GPU-dependent; 10s audio on A5000 ≈ 800ms |
| NLU/Intent extraction | 200–500ms | Rule-based: 50ms; LLM: 500ms–2s |
| Business logic | 100–300ms | Database operations, mostly cached |
| Response formatting | 50–100ms | Template-based |
| Message send | 200–500ms | WhatsApp API latency |
| **Total** | **1.2–3.3s** | Well within 5s target |

### 2.4 The Acknowledgment Pattern

For operations that might exceed 5 seconds (invoice generation, complex queries):

```
User sends voice note: "Genera la factura de María por los 3 cortes de pelo"
    ↓
Yaya (2 seconds): "Generando factura para María... 🧾"  ← instant ack
    ↓
Yaya (5 seconds later): "✅ Factura B001-00234 generada
                          María García - 3 cortes de pelo
                          Total: S/105.00
                          Enviada al correo de María"
```

This pattern feels responsive even when total processing takes 7+ seconds. The user sees immediate acknowledgment, then the complete result.

---

## 3. Self-Hosted STT Architecture

### 3.1 Why Self-Host Whisper

| Factor | Cloud API (OpenAI) | Self-Hosted (c.yaya.sh) |
|---|---|---|
| Latency | 1–3s (network + processing) | 0.5–1.5s (local GPU) |
| Cost per minute | ~$0.006 | ~$0.001 (electricity + amortized GPU) |
| Data residency | Audio sent to US | Audio stays in Peru |
| Compliance | Cross-border biometric transfer | No cross-border issue |
| Availability | 99.9% SLA but no control | Full control, redundancy needed |
| Scalability | Unlimited (pay per use) | Limited by GPU capacity |
| Privacy | Third-party processor | First-party only |

### 3.2 Hardware Requirements

**Current infrastructure (c.yaya.sh):**
- 2× RTX A5000 (24GB VRAM each)
- i9-10900X, 125GB RAM
- Already running Qwen 3.5-27B on one GPU

**Whisper v3 requirements:**
- `whisper-large-v3`: ~3GB VRAM, runs on second A5000
- `whisper-medium`: ~1.5GB VRAM (faster, 95% accuracy of large)
- Throughput: ~30–50 concurrent transcriptions per GPU (short clips)

**Recommended deployment:**
- Primary: whisper-large-v3 on A5000 #2 (alongside Qwen, or time-shared)
- Fallback: whisper-medium on CPU (slower but available if GPU busy)
- Scaling: Add cloud GPU burst capacity when >50 concurrent users

### 3.3 Faster-Whisper for Production

Use `faster-whisper` (CTranslate2-based) instead of standard Whisper:
- **4× faster** inference with same accuracy
- **Lower VRAM** usage (INT8 quantization)
- Supports batching for concurrent requests
- Python API compatible with existing tooling

```python
# Production configuration
from faster_whisper import WhisperModel

model = WhisperModel(
    "large-v3",
    device="cuda",
    compute_type="int8_float16",  # Optimized for A5000
    num_workers=4,
    download_root="/models/whisper"
)

# Transcribe with language hint
segments, info = model.transcribe(
    audio_path,
    language="es",
    beam_size=5,
    vad_filter=True,  # Skip silence
    vad_parameters=dict(min_silence_duration_ms=500)
)
```

### 3.4 Audio Processing Pipeline

```
OGG/Opus (from WhatsApp)
    ↓ ffmpeg conversion (if needed)
WAV/PCM 16kHz mono
    ↓ Voice Activity Detection (VAD)
Trimmed audio (silence removed)
    ↓ faster-whisper transcription
Text + confidence + timestamps
    ↓ Post-processing
Cleaned text (normalized numbers, names)
    ↓ Audio file DELETED
```

---

## 4. NLU Architecture: From Transcription to Business Logic

### 4.1 Intent Classification

Yaya needs to classify voice note transcriptions into business operations. The NLU layer operates in three tiers:

**Tier 1: Pattern Matching (0–50ms)**
Fast regex/rule-based patterns for common operations:
```
"vendí X [product] a [amount]" → SALE intent
"compré X por [amount]" → EXPENSE intent  
"[client] viene [date/time]" → APPOINTMENT intent
"cuánto tengo de [product]" → INVENTORY_QUERY intent
"factura para [client]" → INVOICE intent
"cómo me fue hoy/esta semana" → REPORT_QUERY intent
```

**Tier 2: Local LLM (200–800ms)**
For ambiguous or complex inputs, route to Qwen 3.5-27B (already deployed on c.yaya.sh):
```
"María vino con su hija, le hicieron corte y tinte, 
la hija solo corte, pagaron juntas con Yape"
→ Requires: entity disambiguation, multi-transaction extraction,
  payment method assignment
```

**Tier 3: Cloud LLM Fallback (1–3s)**
For edge cases the local model can't handle, with privacy-preserving text only (no audio).

### 4.2 Entity Extraction Schema

```json
{
  "intent": "SALE",
  "confidence": 0.94,
  "entities": {
    "client": {"name": "María García", "confidence": 0.88},
    "items": [
      {"product": "corte de pelo", "quantity": 1, "unit_price": 35.00},
      {"product": "tinte", "quantity": 1, "unit_price": 70.00}
    ],
    "total": 105.00,
    "payment_method": "yape",
    "payment_status": "paid",
    "notes": "vuelve en 3 semanas para retoque",
    "follow_up_date": "2026-04-12"
  },
  "raw_transcription": "Vendí un corte y tinte a María..."
}
```

### 4.3 Confidence Thresholds and Clarification

| Confidence | Action |
|---|---|
| >0.85 | Process immediately, confirm in response |
| 0.65–0.85 | Process but ask for confirmation: "Registré venta de S/105 a María. ¿Correcto?" |
| 0.40–0.65 | Ask clarifying question: "¿Fue una venta o un gasto?" |
| <0.40 | Apologize and ask to repeat: "No entendí bien. ¿Puedes repetir?" |

---

## 5. Conversation State Management

### 5.1 Session Architecture

Each user has a conversation session managed in Redis:

```json
{
  "user_id": "+51999123456",
  "session_id": "sess_abc123",
  "state": "ACTIVE",
  "last_message": "2026-03-22T02:15:00Z",
  "pending_confirmation": null,
  "context": {
    "recent_transactions": ["txn_001", "txn_002"],
    "last_client_mentioned": "María García",
    "conversation_mode": "normal"
  },
  "window_expires": "2026-03-23T02:15:00Z"
}
```

### 5.2 Multi-Turn Conversation Handling

Voice conversations often span multiple messages:

```
User: "Vendí 3 cortes hoy"
Yaya: "¿A cuánto cada corte?"
User: "35 soles cada uno"
Yaya: "Registré 3 cortes a S/35 = S/105 total. ¿Quién fue el cliente?"
User: "María"
Yaya: "✅ Venta registrada: 3 cortes de pelo × S/35 = S/105 - María García"
```

The orchestrator must maintain state across messages, with reasonable timeouts (5 minutes for active clarification, 24 hours for general context).

---

## 6. Failure Handling and Graceful Degradation

### 6.1 Failure Modes

| Failure | Detection | Response |
|---|---|---|
| Whisper STT failure | Transcription returns empty/error | "No pude entender el audio. ¿Puedes escribirlo?" |
| NLU ambiguity | Confidence <0.40 | "No estoy segura qué quisiste decir. ¿Puedes repetir?" |
| Database unavailable | Connection timeout | "Hay un problema técnico. Tu mensaje fue guardado, lo proceso en unos minutos." |
| WhatsApp API rate limit | 429 response | Queue message, retry with exponential backoff |
| GPU overloaded | Whisper queue >10s | Fall back to CPU Whisper (slower but available) |
| LLM service down | API timeout | Use Tier 1 rules only, flag for human review |
| Network partition | Connectivity loss | Buffer messages locally, process when restored |

### 6.2 The "Never Lose Data" Principle

Voice notes represent real business transactions. Losing one is like losing a page from the business owner's notebook. The architecture must guarantee:

1. **Webhook deduplication:** Process each message exactly once (idempotency by message_id)
2. **Persistent queue:** Messages are durably queued before processing
3. **Audio backup:** Even though audio is deleted after STT, the transcription is always saved
4. **Transaction journaling:** All business operations are logged before and after execution
5. **Retry logic:** Failed processing is retried with exponential backoff, up to 3 attempts

---

## 7. Cost Analysis: Voice Processing at Scale

### 7.1 Per-User Cost Model

Assumptions:
- Average user sends 3–5 voice notes/day
- Average voice note: 8 seconds
- Self-hosted Whisper on existing c.yaya.sh infrastructure

| Component | Cost per Voice Note | Monthly per User (4/day) |
|---|---|---|
| Whisper STT (self-hosted) | ~$0.0005 | $0.06 |
| NLU (Tier 1 rules) | ~$0.0001 | $0.01 |
| NLU (Tier 2 local LLM, 30% of notes) | ~$0.001 | $0.04 |
| WhatsApp API (conversation) | ~$0.003 (amortized) | $0.04 |
| Database/storage | ~$0.0001 | $0.01 |
| Cloud LLM fallback (5% of notes) | ~$0.005 | $0.03 |
| **Total** | **~$0.005** | **$0.19** |

At S/49/month (~$13 USD), the voice processing cost is ~$0.19 = **1.5% of revenue per user**. This is exceptionally healthy unit economics.

### 7.2 Scaling Breakpoints

| Users | Voice Notes/Day | GPU Utilization | Infrastructure Needed |
|---|---|---|---|
| 1–500 | 2,000 | <10% of A5000 | Current c.yaya.sh |
| 500–2,000 | 8,000 | ~30% of A5000 | Current c.yaya.sh |
| 2,000–5,000 | 20,000 | ~75% of A5000 | May need second GPU or cloud burst |
| 5,000–10,000 | 40,000 | >100% of single GPU | Cloud GPU or second server required |
| 10,000+ | 40,000+ | Multi-GPU cluster | Dedicated ML infrastructure |

The existing c.yaya.sh infrastructure supports the first 2,000–5,000 users without additional hardware investment. At 5,000 users × S/49 = S/245K/month (~$65K USD/month) revenue, the infrastructure investment for scaling is easily justified.

---

## 8. Security Considerations

### 8.1 Data in Transit
- WhatsApp webhook: HTTPS with Meta signature validation (HMAC SHA256)
- Internal services: mTLS between microservices
- Database: TLS connections, encrypted at rest

### 8.2 Data at Rest
- Audio: NOT stored (deleted after transcription)
- Transcriptions: Encrypted at rest (AES-256)
- Business data: Encrypted at rest, per-user access control
- Audit logs: Append-only, cryptographically signed

### 8.3 Access Control
- Per-user data isolation (row-level security in PostgreSQL)
- Service accounts with minimal privileges
- No shared credentials between components
- API keys rotated regularly

---

## 9. Monitoring and Observability

### 9.1 Key Metrics to Track

| Metric | Target | Alert Threshold |
|---|---|---|
| End-to-end latency (voice → response) | <5s (p95) | >8s |
| STT latency | <1.5s (p95) | >3s |
| STT accuracy (manual sample) | >92% | <85% |
| NLU confidence (average) | >0.80 | <0.65 |
| Failed transcriptions | <2% | >5% |
| User clarification requests | <15% | >25% |
| Message delivery success | >99.5% | <98% |
| GPU utilization | <75% | >90% |

### 9.2 Conversation-Level Tracing

Every voice note interaction should produce a trace:

```
trace_id: tr_2026032202150001
user: +51999123456
timestamp: 2026-03-22T02:15:00Z
stages:
  - webhook_received: 0ms
  - media_downloaded: 320ms (file: 87KB)
  - stt_completed: 1240ms (text: "vendí un corte a María, 35 soles, Yape")
  - nlu_completed: 1380ms (intent: SALE, confidence: 0.93)
  - business_logic: 1520ms (txn: txn_abc123, status: OK)
  - response_sent: 1780ms (type: text, chars: 67)
total_latency: 1780ms
audio_deleted: true
```

---

## 10. Key Recommendations for Andre

### 1. Design for Asynchronous, Not Real-Time
WhatsApp voice notes are batch media files, not streaming audio. Every architectural decision should embrace this constraint rather than fight it. The "acknowledge then complete" pattern makes 8-second operations feel like 2-second operations.

### 2. Self-Host Whisper on c.yaya.sh from Day One
The existing 2× A5000 GPUs can handle Whisper and Qwen simultaneously. Self-hosting eliminates cross-border audio transfer, cuts latency by 50%+, and reduces per-note cost to $0.0005. There is no technical reason to use cloud STT for the MVP.

### 3. Rule-Based NLU First, LLM Second
70% of business voice notes follow predictable patterns ("vendí X a Y por Z"). Fast regex matching handles these in <50ms. Reserve LLM reasoning for the 30% of complex/ambiguous cases. This keeps cost low and latency fast.

### 4. The 5-Second Budget Is Your North Star
If a user sends a voice note and gets a response in under 5 seconds, they'll feel like they're talking to a real assistant. Above 8 seconds feels sluggish. Every engineering decision should be measured against this latency budget.

### 5. Never Lose a Transaction
Voice notes are business records. The architecture must guarantee exactly-once processing with durable queuing, retry logic, and comprehensive audit trails. Losing a user's sale record is equivalent to tearing a page from their notebook — it destroys trust instantly.

### 6. The Architecture Scales to 5,000 Users on Existing Hardware
Current infrastructure (c.yaya.sh) supports ~2,000–5,000 daily active users without additional hardware. At that scale, monthly revenue exceeds $65K USD, more than justifying the next infrastructure investment. Build for 500 users, plan for 5,000.

---

## 11. Sources

- Buzzi.ai — WhatsApp Voice AI Integration Architecture (2025)
- Build With AWS — Multimodal WhatsApp Agent Architecture (2025)
- Meta — WhatsApp Business Platform Documentation (2026)
- Meta — WhatsApp Cloud API Reference (v18.0)
- OpenAI — Whisper API Documentation
- faster-whisper — CTranslate2 Whisper Implementation (GitHub)
- Google Cloud — Dialogflow Latency Best Practices
- WhatsApp Voice AI Assistant — Microservices Reference Implementation (GitHub)

---

*This reference architecture transforms Yaya's voice-first vision from concept to engineering specification. The key insight: WhatsApp voice AI is solved by embracing asynchronous media processing, self-hosting STT for compliance and cost, and maintaining strict latency budgets. The existing c.yaya.sh infrastructure supports the first 2,000–5,000 users. Build this pipeline, and the "Conversational CEO" vision becomes technically real.*
