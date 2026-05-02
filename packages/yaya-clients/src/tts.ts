/**
 * Kokoro-FastAPI client (`:8002` per INFRA.md). Wraps every endpoint:
 *   - /v1/audio/speech (POST, JSON — OpenAI-compat TTS)
 *   - /v1/audio/voices (GET)
 *   - /v1/audio/voices/combine (POST, blend voices)
 *   - /v1/models (GET)
 *   - /dev/captioned_speech (POST, TTS + word timestamps)
 *   - /dev/phonemize (POST, debug)
 *   - /dev/generate_from_phonemes (POST, debug)
 *   - /health (GET)
 *   - /debug/{system,storage,session_pools,threads}
 */
import { ttsConfig, authHeaders, trimSlash, type TtsConfig } from "./config.js";

export type TtsFormat = "wav" | "mp3" | "opus" | "flac" | "pcm";

export interface SpeakParams {
  input: string;
  voice?: string;
  model?: string;
  response_format?: TtsFormat;
  speed?: number;
  stream?: boolean;
  lang_code?: string; // "e" Spanish, "a" American, etc.
  volume_multiplier?: number;
  normalization_options?: unknown;
  return_download_link?: boolean;
}

export class TtsClient {
  readonly cfg: TtsConfig;
  constructor(overrides: Partial<TtsConfig> = {}) {
    this.cfg = ttsConfig(overrides);
    this.cfg.url = trimSlash(this.cfg.url);
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { "Content-Type": "application/json", ...authHeaders(this.cfg.apiKey), ...extra };
  }

  private url(p: string): string { return `${this.cfg.url}${p}`; }

  health(): Promise<Response> { return fetch(this.url("/health"), { headers: this.headers() }); }

  async listModels(): Promise<{ data: { id: string }[] }> {
    const r = await fetch(this.url("/v1/models"), { headers: this.headers() });
    if (!r.ok) throw new Error(`listModels ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async listVoices(): Promise<{ voices: string[] } | string[]> {
    const r = await fetch(this.url("/v1/audio/voices"), { headers: this.headers() });
    if (!r.ok) throw new Error(`listVoices ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async combineVoices(voices: string[]): Promise<unknown> {
    const r = await fetch(this.url("/v1/audio/voices/combine"), {
      method: "POST", headers: this.headers(), body: JSON.stringify({ voices }),
    });
    if (!r.ok) throw new Error(`combineVoices ${r.status}: ${await r.text()}`);
    return r.json();
  }

  /** Synthesize speech. Returns audio bytes in `response_format` (default mp3). */
  async speak(p: SpeakParams): Promise<ArrayBuffer> {
    const r = await fetch(this.url("/v1/audio/speech"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: p.model ?? this.cfg.model,
        voice: p.voice ?? this.cfg.voice,
        response_format: p.response_format ?? this.cfg.format,
        ...p,
      }),
    });
    if (!r.ok) throw new Error(`speak ${r.status}: ${await r.text()}`);
    return r.arrayBuffer();
  }

  /** Streaming speech. Yields audio chunks (binary) — useful for low-latency playback. */
  async *speakStream(p: SpeakParams): AsyncGenerator<Uint8Array, void, unknown> {
    const r = await fetch(this.url("/v1/audio/speech"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: p.model ?? this.cfg.model,
        voice: p.voice ?? this.cfg.voice,
        response_format: p.response_format ?? this.cfg.format,
        stream: true,
        ...p,
      }),
    });
    if (!r.ok || !r.body) throw new Error(`speakStream ${r.status}: ${await r.text().catch(() => "")}`);
    const reader = r.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  }

  /** TTS + word-level timestamps. */
  async captionedSpeech(p: SpeakParams): Promise<{ audio: string; alignment: unknown }> {
    const r = await fetch(this.url("/dev/captioned_speech"), {
      method: "POST", headers: this.headers(),
      body: JSON.stringify({
        model: p.model ?? this.cfg.model,
        voice: p.voice ?? this.cfg.voice,
        response_format: p.response_format ?? this.cfg.format,
        ...p,
      }),
    });
    if (!r.ok) throw new Error(`captionedSpeech ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async phonemize(text: string, lang_code?: string): Promise<{ phonemes: string }> {
    const r = await fetch(this.url("/dev/phonemize"), {
      method: "POST", headers: this.headers(),
      body: JSON.stringify({ text, lang_code: lang_code ?? "e" }),
    });
    if (!r.ok) throw new Error(`phonemize ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async generateFromPhonemes(phonemes: string, voice?: string): Promise<ArrayBuffer> {
    const r = await fetch(this.url("/dev/generate_from_phonemes"), {
      method: "POST", headers: this.headers(),
      body: JSON.stringify({ phonemes, voice: voice ?? this.cfg.voice }),
    });
    if (!r.ok) throw new Error(`generateFromPhonemes ${r.status}: ${await r.text()}`);
    return r.arrayBuffer();
  }

  async debug(section: "system" | "storage" | "session_pools" | "threads"): Promise<unknown> {
    const r = await fetch(this.url(`/debug/${section}`), { headers: this.headers() });
    if (!r.ok) throw new Error(`debug ${r.status}: ${await r.text()}`);
    return r.json();
  }
}

export const tts = (overrides: Partial<TtsConfig> = {}) => new TtsClient(overrides);
