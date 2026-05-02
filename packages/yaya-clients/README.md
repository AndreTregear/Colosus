# @yaya/clients

Composable TypeScript clients for the Yaya voice infrastructure documented in [`INFRA.md`](../../INFRA.md).

| Service       | Default URL              | Default key            | Endpoints covered |
|---------------|--------------------------|------------------------|-------------------|
| LLM (vLLM)    | `http://localhost:8000/v1` | `welcometothepresent` | `/v1/chat/completions`, `/v1/completions`, `/v1/responses`, `/v1/messages`, `/v1/models`, `/tokenize`, `/detokenize`, `/health`, `/ping`, `/metrics` |
| ASR (Speaches)| `http://localhost:8001`    | `welcometothepresent` | `/v1/audio/transcriptions`, `/v1/audio/translations`, `/v1/audio/speech/timestamps`, `/v1/audio/speech`, `/v1/realtime` (WS), `/v1/models` (CRUD), `/v1/registry`, `/api/ps`, `/health` |
| ASR (stream)  | `ws://localhost:9090`      | `welcometothepresent` | streaming-asr WS protocol (`ready`/`speech_end`/`transcript`/`error`) |
| TTS (Kokoro)  | `http://localhost:8002`    | `welcometothepresent` | `/v1/audio/speech` (incl. streaming), `/v1/audio/voices`, `/v1/audio/voices/combine`, `/v1/models`, `/dev/captioned_speech`, `/dev/phonemize`, `/dev/generate_from_phonemes`, `/health`, `/debug/*` |

All four bearer-protected; the proxy in front of Speaches/Kokoro also accepts `?api_key=…` for browser WebSockets.

## Install

```bash
# from any package in the colosus repo
npm install file:../packages/yaya-clients
```

## Usage

```ts
import { llm, asr, asrStream, tts, createYayaClients } from "@yaya/clients";

// 1. Defaults from env (see "Env vars" below)
const text = (await llm().chat({ messages: [{ role: "user", content: "hola" }] })).text;

// 2. Per-instance overrides — every URL/key swappable at runtime
const remote = llm({ url: "https://ai.yaya.sh/v1", apiKey: process.env.PROD_KEY! });

// 3. All four at once
const { llm: L, asr: A, tts: T, asrStream: S } = createYayaClients();
```

## Env vars

Canonical names (recommended) and legacy aliases (still honored):

```
YAYA_LLM_URL    | VLLM_API_BASE   | VLLM_URL
YAYA_LLM_KEY    | VLLM_API_KEY
YAYA_LLM_MODEL  | VLLM_MODEL

YAYA_ASR_URL    | SPEACHES_URL    | WHISPER_BASE_URL | WHISPER_URL
YAYA_ASR_KEY    | SPEACHES_API_KEY| WHISPER_API_KEY
YAYA_ASR_MODEL  | WHISPER_MODEL
YAYA_ASR_LANG   | WHISPER_LANGUAGE

YAYA_ASR_WS_URL | STREAMING_ASR_URL
YAYA_ASR_WS_KEY | STREAMING_ASR_KEY    (falls back to YAYA_ASR_KEY)

YAYA_TTS_URL    | KOKORO_URL      | TTS_BASE_URL | TTS_URL
YAYA_TTS_KEY    | KOKORO_API_KEY  | TTS_API_KEY
YAYA_TTS_VOICE  | TTS_VOICE
YAYA_TTS_MODEL  | TTS_MODEL
YAYA_TTS_FORMAT | TTS_FORMAT
```

## Examples

**Streaming chat (Qwen3 thinking enabled):**
```ts
for await (const chunk of llm().chatStream({
  messages: [{ role: "user", content: "Explain prefix caching." }],
  chat_template_kwargs: { enable_thinking: true },
})) {
  process.stdout.write(chunk.choices?.[0]?.delta?.content ?? "");
}
```

**Whisper transcription (Speaches):**
```ts
import { readFile } from "node:fs/promises";
const audio = await readFile("call.wav");
const { text } = await asr().transcribe({ file: audio, fileName: "call.wav", language: "es" }) as any;
```

**Live transcription over WS (streaming-asr):**
```ts
const session = await asrStream().open({
  uid: "call-42", language: "es",
  onEvent: (e) => { if (e.type === "transcript") console.log(e.text); },
});
await session.ready;
session.sendPcm(pcm16k);    // Float32, mono, 16 kHz
await session.flushAndClose();
```

**TTS:**
```ts
const mp3 = await tts().speak({ input: "Hola, ¿en qué puedo ayudarte?" });
```

## Build

```bash
npm install
npm run build
```
