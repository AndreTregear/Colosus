# Yaya Infrastructure — Running Services

Snapshot: 2026-05-02. Host: 2× RTX A5000 24 GB, Linux 6.12, driver 550.163 / CUDA 12.4.

## Quick reference

| External port | Service | Type | Manager | GPU | Auth |
|---|---|---|---|---|---|
| 8000 | vLLM (LLM) | OpenAI-compat REST | PM2 `vllm-qwen` | 0+1 (TP=2) | Bearer `welcometothepresent` |
| 8001 | Speaches (Whisper REST) — fronted by nginx | OpenAI-compat REST | docker `speaches` (127.0.0.1:18001) + nginx | 0 | Bearer `welcometothepresent` |
| 8002 | Kokoro-FastAPI (TTS) — fronted by nginx | OpenAI-compat REST | docker `kokoro-tts` (127.0.0.1:18002) + nginx | 1 | Bearer `welcometothepresent` |
| 8003 | streaming-asr (live ASR) | WebSocket (custom JSON) | PM2 `streaming-asr` | 0 | Bearer `welcometothepresent` |
| 22 | SSH | systemd | — | — | keys |

**All four AI services share one bearer token (`welcometothepresent`)**. Speaches and Kokoro are fronted by nginx (config at `/etc/nginx/sites-available/voice-auth` + `/etc/nginx/conf.d/voice-auth-maps.conf`); the upstream containers are bound to `127.0.0.1:18001` / `127.0.0.1:18002` and not directly reachable. Streaming-asr accepts the bearer in the `Authorization` header **or** `?api_key=` query string (browser WebSocket can't set headers). Composable TS clients live at `colosus/packages/yaya-clients/`.

---

## 1. LLM — vLLM serving Qwen3.6-35B-A3B (`:8000`)

**Process:** PM2 `vllm-qwen` → `bash -c "/home/yaya/.local/bin/vllm serve cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit ..."`.

**Model:** `cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit` (35B-param hybrid Mamba/Transformer MoE, 3B active, INT4 AWQ-Marlin).

**Key flags:**
```
--tensor-parallel-size 2
--max-model-len 131072
--max-num-seqs 16
--max-num-batched-tokens 8192   # Mamba block alignment requires >= 2096
--kv-cache-dtype fp8
--gpu-memory-utilization 0.75
--enforce-eager                 # required for hybrid arch
--enable-prefix-caching
--enable-auto-tool-choice --tool-call-parser qwen3_coder
--reasoning-parser qwen3
--api-key welcometothepresent
```

**Auth:** every request needs `Authorization: Bearer welcometothepresent`.

**Endpoints (most-used):**

| Path | Method | Purpose |
|---|---|---|
| `/v1/models` | GET | list loaded model |
| `/v1/chat/completions` | POST | OpenAI Chat API; supports streaming, tool calls, JSON mode |
| `/v1/completions` | POST | OpenAI raw-prompt completion; supports streaming |
| `/v1/messages` | POST | Anthropic-compat (Messages API shape) |
| `/v1/responses` | POST | OpenAI Responses API |
| `/tokenize`, `/detokenize` | POST | tokenizer utilities |
| `/health`, `/ping` | GET | liveness |
| `/metrics` | GET | Prometheus metrics |
| `/v1/chat/completions/batch` | POST | batch completion mode |

**Chat completion request shape (OpenAI):**
```json
{
  "model": "cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit",
  "messages": [{"role":"system","content":"..."},{"role":"user","content":"..."}],
  "max_tokens": 1024,
  "temperature": 0.2,
  "stream": true,
  "tools": [{"type":"function","function":{"name":"...","parameters":{...}}}]
}
```

**Tool-call parser:** `qwen3_coder` (works for general Qwen3 chat too). System prompts must be kept short for reliable tool calling on this model — long instruction blocks degrade tool-call accuracy.

**Performance reference (current config):**
- single-stream decode: ~16 tok/s
- 8 concurrent streams: ~120 tok/s aggregate, ~14 tok/s/stream
- prefill: peak ~16k tok/s at 32k context, ~5–13k tok/s at long contexts
- 64k prompt cold prefill: ~10 s; with prefix caching, repeated system-prompt calls are near-instant
- max context: 131,072 tokens (verified up to 126k)

---

## 2. ASR REST — Speaches (`:8001`)

**Container:** `ghcr.io/speaches-ai/speaches:latest-cuda` → name `speaches`, GPU 0, port `127.0.0.1:18001 → container:8000`. Nginx listens on `0.0.0.0:8001` and proxies with bearer auth.
Env: `WHISPER__USE_BATCHED_MODE=true WHISPER__NUM_WORKERS=4 WHISPER__COMPUTE_TYPE=int8_float16 NVIDIA_DISABLE_REQUIRE=1`.
HF cache mounted from host: `/home/yaya/.cache/huggingface → /home/ubuntu/.cache/huggingface`.

**Auth:** every request needs `Authorization: Bearer welcometothepresent` (or `?api_key=welcometothepresent` for browser WS).

**Loaded model:** `deepdml/faster-whisper-large-v3-turbo-ct2` (multilingual, includes ES/EN/PT). Model must be pulled once via `POST /v1/models/{id}` after first start (env var alone doesn't auto-pull on this image).

**Endpoints:**

| Path | Method | Purpose |
|---|---|---|
| `/v1/models` | GET | list pulled models |
| `/v1/models/{model_id}` | POST | pull a model (download + load) |
| `/v1/models/{model_id}` | DELETE | unload a model |
| `/v1/registry` | GET | list available models (filter `?task=automatic-speech-recognition` or `text-to-speech`) |
| `/v1/audio/transcriptions` | POST | OpenAI-compat transcription |
| `/v1/audio/speech/timestamps` | POST | timestamped transcription |
| `/v1/audio/translations` | POST | transcribe + translate to English |
| `/v1/audio/speech` | POST | TTS (Speaches also serves Kokoro ONNX — unused here, we use the dedicated container) |
| `/v1/realtime` | WS | OpenAI Realtime-API-compatible WebSocket |
| `/api/ps` | GET | currently-loaded model state |
| `/health` | GET | liveness |

**Transcription request (multipart/form-data):**
```
POST /v1/audio/transcriptions
Content-Type: multipart/form-data
  file: <audio file>                (required — wav/mp3/m4a/ogg/flac/webm)
  model: deepdml/faster-whisper-large-v3-turbo-ct2  (required)
  language: es                      (optional ISO-639 code; auto-detect if absent)
  prompt: ...                        (optional bias text)
  response_format: json | text | srt | verbose_json | vtt
  temperature: 0.0                   (optional)
  timestamp_granularities: ["segment","word"]
  stream: true | false
  vad_filter: true | false
  hotwords: "Yaya, Izipay, Yape"     (optional)
```
**Response (`json`):** `{"text": "..."}`. With `verbose_json` you also get `segments` (array of `{start,end,text,...}`) and `language`.

**Performance reference:** ~275 ms serial latency for 5 s of Spanish, ~4.4 rps under continuous load.

**OpenAI Realtime API:** Speaches exposes `/v1/realtime` (WS). For streaming live calls we use the dedicated `streaming-asr` service below instead — it gives finer control over VAD and segment routing.

---

## 3. ASR streaming — `streaming-asr` (`ws://:8003`)

**Process:** PM2 `streaming-asr` → `python /home/yaya/streaming-asr.py`, venv `/home/yaya/.venvs/streaming-asr` (Python 3.11).
Runs on GPU 0 alongside Speaches. Whisper instance is **shared across all WS clients** via faster-whisper `BatchedInferencePipeline`, so adding callers queues into the batched scheduler — no per-call model copies.

**Auth:** WebSocket handshake must include `Authorization: Bearer welcometothepresent`. Browser clients (which can't set WS headers) may pass `?api_key=welcometothepresent` or `?token=…` in the URL. Configurable via `ASR_API_KEY` env var.

**Components:**
- Silero VAD v5 (ONNX, CPU) via the `silero-vad` Python package — speech-segment detection per stream.
- `faster-whisper` with the same `deepdml/faster-whisper-large-v3-turbo-ct2` model, `int8_float16` on `cuda:0`.

**Tunable env vars (defaults shown):**
```
ASR_PORT=8003
WHISPER_MODEL=deepdml/faster-whisper-large-v3-turbo-ct2
WHISPER_DEVICE=cuda
WHISPER_DEVICE_INDEX=0
WHISPER_COMPUTE=int8_float16
VAD_THRESHOLD=0.5
VAD_MIN_SPEECH_MS=200
VAD_HANGOVER_MS=400
MAX_SEGMENT_S=20.0
```

**Protocol:**

1. Client opens WS to `ws://<host>:8003`.
2. Client sends a single JSON header (text frame):
   ```json
   {"uid": "call-abc-123", "language": "es"}
   ```
3. Server replies:
   ```json
   {"type": "ready", "uid": "call-abc-123"}
   ```
4. Client streams binary frames of raw **`float32` mono PCM at 16 kHz**. Any chunk size — server buffers and feeds to VAD in 512-sample frames internally. To flush a final segment, append ≥400 ms of silence (zero samples) before closing — VAD needs trailing silence to detect end-of-speech.
5. Server emits two messages per detected segment:
   ```json
   {"type": "speech_end", "uid": "...", "samples": 56000, "start": 12000, "end": 68000}
   ```
   then once Whisper completes:
   ```json
   {
     "type": "transcript",
     "uid": "...",
     "text": "Hola, gracias por llamar a Yaya.",
     "language": "es",
     "language_probability": 0.99,
     "duration_audio": 3.5,
     "queue_ms": 12.4,
     "infer_ms": 165.2,
     "wall_ms": 178.0
   }
   ```
6. On error: `{"type": "error", "uid": "...", "error": "..."}`.

**Latency budget:** speech-end → transcript ≈ 500–700 ms (400 ms VAD hangover + ~150 ms whisper inference).

**Capacity (this hardware):** ~50–80 concurrent live calls assuming natural turn-taking silence (~50% of wall time is non-speech). VAD itself is ~1% CPU per call.

---

## 4. TTS — Kokoro-FastAPI (`:8002`)

**Container:** `ghcr.io/remsky/kokoro-fastapi-gpu:latest` → name `kokoro-tts`, GPU 1, port `127.0.0.1:18002 → container:8880`. Nginx listens on `0.0.0.0:8002` and proxies with bearer auth. Env `NVIDIA_DISABLE_REQUIRE=1`.

**Auth:** every request needs `Authorization: Bearer welcometothepresent` (or `?api_key=welcometothepresent`).

**Loaded model:** Kokoro-82M v1.0 multilingual (bundled in image, no external download).

**Spanish voices:** `ef_dora` (female), `em_alex` (male), `em_santa` (male). Default sample rate 24 kHz.

**Endpoints:**

| Path | Method | Purpose |
|---|---|---|
| `/v1/audio/speech` | POST | OpenAI-compat TTS |
| `/v1/audio/voices` | GET | list available voices |
| `/v1/audio/voices/combine` | POST | blend voices |
| `/v1/models` | GET | list models (`tts-1`, `tts-1-hd`, `kokoro` aliases) |
| `/dev/captioned_speech` | POST | TTS + word timestamps |
| `/dev/phonemize` | POST | text → phonemes (debug) |
| `/dev/generate_from_phonemes` | POST | phonemes → audio (debug) |
| `/health` | GET | liveness |
| `/debug/{system,storage,session_pools,threads}` | GET | introspection |
| `/web/*` | GET | bundled web UI |

**TTS request (`application/json`):**
```json
{
  "model": "kokoro",
  "input": "Hola, ¿en qué puedo ayudarte?",
  "voice": "ef_dora",
  "response_format": "wav",        // wav | mp3 | opus | flac | pcm
  "speed": 1.0,
  "stream": false,                 // true → streamed audio chunks
  "lang_code": "e",                // optional: "e" Spanish, "a" American, etc.
  "volume_multiplier": 1.0,
  "normalization_options": null,
  "return_download_link": false
}
```
**Response:** binary audio in `response_format` (or `text/event-stream` chunked PCM when `stream=true`).

**Performance reference:** ~76 ms/request serial for 5 s utterances (~65× realtime). Single Kokoro worker, ~14.5 rps. For live calls this is ~10× over-provisioned; concurrency is not the limit.

---

## 5. GPU layout

```
GPU 0 (24 GB):  vLLM TP shard (~17.7 GB)
              + Speaches whisper (~1 GB)
              + streaming-asr whisper (~1.5 GB shared model)
              ≈ 20 GB used, ~4 GB free

GPU 1 (24 GB):  vLLM TP shard (~17.7 GB)
              + Kokoro TTS (~1 GB)
              ≈ 19 GB used, ~5 GB free
```

`--gpu-memory-utilization 0.75` is the lever that frees the GPU budget for whisper/Kokoro alongside vLLM. Bumping vLLM back to 0.92 reclaims those 7 GB but evicts the voice services.

## 6. Process management

- **PM2** (`pm2 list`, `pm2 logs <name>`, `pm2 restart <name>`) — managed: `vllm-qwen`, `streaming-asr`, `pm2-logrotate`. Logs at `~/.pm2/logs/`.
- **Docker** (`docker ps`, `docker logs <name>`) — managed: `speaches` (127.0.0.1:18001), `kokoro-tts` (127.0.0.1:18002). All set with `--restart unless-stopped`.
- **systemd** — sshd, nginx (also fronts Speaches/Kokoro on 8001/8002 with bearer auth — see `/etc/nginx/sites-available/voice-auth`), tailscaled, cloudflared. **Never stop these** — they are the user's access paths.

## 6.1. Composable TypeScript clients

Every endpoint in this doc has a typed client at `colosus/packages/yaya-clients/`. Every URL and API key is overridable via env var (`YAYA_LLM_URL` / `YAYA_LLM_KEY` / …, with legacy aliases like `VLLM_API_BASE` still honored). One import covers all four services:

```ts
import { llm, asr, asrStream, tts, createYayaClients } from "@yaya/clients";
const { text } = await llm().chat({ messages: [{ role: "user", content: "hi" }] });
const audio   = await tts().speak({ input: "hola" });
```

See `colosus/packages/yaya-clients/README.md` for the full surface and env-var table.

## 7. Caches & on-disk paths

| Path | What |
|---|---|
| `/home/yaya/.cache/huggingface/hub/` | Qwen3.6-* and Whisper turbo CT2 weights. **Never delete `models--*--Qwen3.6-*`** — that family is SOTA and protected. |
| `/home/yaya/.cache/silero_vad.onnx` | Silero VAD ONNX (downloaded by `silero-vad` package, ~1.7 MB) |
| `/home/yaya/.venvs/streaming-asr/` | venv for streaming-asr (faster-whisper, websockets, silero-vad, torch, numpy) |
| `/home/yaya/.venvs/voice-lb/` | venv used for the round-robin LB experiment (rolled back; venv kept as bench-script runtime) |
| `/home/yaya/.local/share/pipx/venvs/vllm/` | pipx-managed vLLM install. Hybrid arch needs `CUDA_HOME=/usr` + `ninja` on PATH at first inference. |
| `/home/yaya/streaming-asr.py` | Source of the streaming ASR server |
| `/home/yaya/voice-lb.py` | Optional Python aiohttp round-robin LB (template, not running) |
| `/home/yaya/.pm2/logs/` | PM2 stdout/stderr per service |

## 8. Driver / CUDA gotcha

Host driver is **550.163 (CUDA 12.4)**. Modern containers default to CUDA 12.6/12.8 base images and either:

- Refuse to start (libnvidia-container `NVIDIA_REQUIRE_CUDA` check) → bypass with `-e NVIDIA_DISABLE_REQUIRE=1` (used for Speaches and Kokoro).
- Silently fall back to CPU (PyTorch's runtime CUDA check is stricter than libnvidia-container) → encountered with `ghcr.io/collabora/whisperlive-gpu`. The native venv install of `streaming-asr` avoids this.

Updating the driver would clean both cases up but risks disturbing vLLM. Don't update without a planned restart window.
