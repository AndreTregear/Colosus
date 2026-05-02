/**
 * Speaches client (`:8001` per INFRA.md). Wraps every endpoint listed:
 *   - /v1/models (GET, POST {id} = pull, DELETE {id} = unload)
 *   - /v1/registry (GET, ?task=automatic-speech-recognition|text-to-speech)
 *   - /v1/audio/transcriptions (POST, multipart)
 *   - /v1/audio/translations (POST, multipart)
 *   - /v1/audio/speech (POST, JSON — Speaches can also TTS via Kokoro ONNX)
 *   - /v1/audio/speech/timestamps (POST, multipart)
 *   - /v1/realtime (WebSocket, OpenAI Realtime API compatible)
 *   - /api/ps (GET, currently-loaded models)
 *   - /health (GET)
 */
import { asrConfig, authHeaders, trimSlash, type AsrConfig } from "./config.js";

export type ResponseFormat = "json" | "text" | "srt" | "verbose_json" | "vtt";

export interface TranscribeParams {
  file: Blob | Uint8Array | ArrayBuffer | string; // string = path-like; only Blob/binary supported in browser
  fileName?: string;
  model?: string;
  language?: string;
  prompt?: string;
  response_format?: ResponseFormat;
  temperature?: number;
  timestamp_granularities?: ("segment" | "word")[];
  stream?: boolean;
  vad_filter?: boolean;
  hotwords?: string;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: { start: number; end: number; text: string }[];
}

export class AsrClient {
  readonly cfg: AsrConfig;
  constructor(overrides: Partial<AsrConfig> = {}) {
    this.cfg = asrConfig(overrides);
    this.cfg.url = trimSlash(this.cfg.url);
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { ...authHeaders(this.cfg.apiKey), ...extra };
  }

  private url(p: string): string { return `${this.cfg.url}${p}`; }

  health(): Promise<Response> { return fetch(this.url("/health"),  { headers: this.headers() }); }

  async listModels(): Promise<{ data: { id: string }[] }> {
    const r = await fetch(this.url("/v1/models"), { headers: this.headers() });
    if (!r.ok) throw new Error(`listModels ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async pullModel(id: string): Promise<{ id: string }> {
    const r = await fetch(this.url(`/v1/models/${encodeURIComponent(id)}`), {
      method: "POST", headers: this.headers(),
    });
    if (!r.ok && r.status !== 409 /* already-loaded */) {
      throw new Error(`pullModel ${r.status}: ${await r.text()}`);
    }
    return r.ok ? r.json() : { id };
  }

  async unloadModel(id: string): Promise<void> {
    const r = await fetch(this.url(`/v1/models/${encodeURIComponent(id)}`), {
      method: "DELETE", headers: this.headers(),
    });
    if (!r.ok && r.status !== 404) throw new Error(`unloadModel ${r.status}: ${await r.text()}`);
  }

  async registry(task?: "automatic-speech-recognition" | "text-to-speech"): Promise<unknown> {
    const u = task ? this.url(`/v1/registry?task=${encodeURIComponent(task)}`) : this.url("/v1/registry");
    const r = await fetch(u, { headers: this.headers() });
    if (!r.ok) throw new Error(`registry ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async ps(): Promise<unknown> {
    const r = await fetch(this.url("/api/ps"), { headers: this.headers() });
    if (!r.ok) throw new Error(`ps ${r.status}: ${await r.text()}`);
    return r.json();
  }

  /** OpenAI-compat transcription. Returns parsed JSON or raw text per `response_format`. */
  async transcribe(p: TranscribeParams): Promise<TranscriptionResponse | string> {
    const fd = await this.buildForm(p, "transcriptions");
    const r = await fetch(this.url("/v1/audio/transcriptions"), {
      method: "POST", headers: this.headers(), body: fd,
    });
    if (!r.ok) throw new Error(`transcribe ${r.status}: ${await r.text()}`);
    return p.response_format === "text" || p.response_format === "srt" || p.response_format === "vtt"
      ? r.text() : r.json();
  }

  async transcribeWithTimestamps(p: TranscribeParams): Promise<TranscriptionResponse> {
    const fd = await this.buildForm(p, "transcriptions");
    const r = await fetch(this.url("/v1/audio/speech/timestamps"), {
      method: "POST", headers: this.headers(), body: fd,
    });
    if (!r.ok) throw new Error(`timestamps ${r.status}: ${await r.text()}`);
    return r.json();
  }

  /** Whisper-translate to English. */
  async translate(p: TranscribeParams): Promise<TranscriptionResponse | string> {
    const fd = await this.buildForm(p, "translations");
    const r = await fetch(this.url("/v1/audio/translations"), {
      method: "POST", headers: this.headers(), body: fd,
    });
    if (!r.ok) throw new Error(`translate ${r.status}: ${await r.text()}`);
    return p.response_format === "text" || p.response_format === "srt" || p.response_format === "vtt"
      ? r.text() : r.json();
  }

  /** Streaming transcription (SSE-like). Yields raw decoded chunks. */
  async *transcribeStream(p: TranscribeParams): AsyncGenerator<string, void, unknown> {
    const fd = await this.buildForm({ ...p, stream: true }, "transcriptions");
    const r = await fetch(this.url("/v1/audio/transcriptions"), {
      method: "POST", headers: this.headers(), body: fd,
    });
    if (!r.ok || !r.body) throw new Error(`transcribeStream ${r.status}`);
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      yield dec.decode(value, { stream: true });
    }
  }

  /** OpenAI Realtime WS URL with auth as query param (most browser WS clients can't set headers). */
  realtimeUrl(extra: Record<string, string> = {}): string {
    const wsBase = this.cfg.url.replace(/^http/, "ws");
    const qs = new URLSearchParams({ api_key: this.cfg.apiKey, ...extra });
    return `${wsBase}/v1/realtime?${qs.toString()}`;
  }

  private async buildForm(p: TranscribeParams, _kind: "transcriptions" | "translations"): Promise<FormData> {
    const fd = new FormData();
    let blob: Blob;
    let name = p.fileName ?? "audio.wav";
    if (typeof p.file === "string") {
      // path-like: read via fetch (works for file:// in node 22+, http(s)) — caller responsibility on Node
      const r = await fetch(p.file);
      blob = await r.blob();
      name = p.fileName ?? p.file.split("/").pop() ?? name;
    } else if (p.file instanceof Blob) {
      blob = p.file;
    } else if (p.file instanceof ArrayBuffer) {
      blob = new Blob([p.file]);
    } else {
      // Uint8Array — copy into ArrayBuffer to satisfy strict BlobPart typing
      const u8 = p.file as Uint8Array;
      const ab = new ArrayBuffer(u8.byteLength);
      new Uint8Array(ab).set(u8);
      blob = new Blob([ab]);
    }
    fd.append("file", blob, name);
    fd.append("model", p.model ?? this.cfg.model);
    if (p.language ?? this.cfg.language) fd.append("language", (p.language ?? this.cfg.language)!);
    if (p.prompt) fd.append("prompt", p.prompt);
    if (p.response_format) fd.append("response_format", p.response_format);
    if (p.temperature !== undefined) fd.append("temperature", String(p.temperature));
    if (p.timestamp_granularities) for (const g of p.timestamp_granularities) fd.append("timestamp_granularities[]", g);
    if (p.stream) fd.append("stream", "true");
    if (p.vad_filter !== undefined) fd.append("vad_filter", String(p.vad_filter));
    if (p.hotwords) fd.append("hotwords", p.hotwords);
    return fd;
  }
}

export const asr = (overrides: Partial<AsrConfig> = {}) => new AsrClient(overrides);
