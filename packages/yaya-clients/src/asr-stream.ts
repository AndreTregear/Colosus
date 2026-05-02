/**
 * streaming-asr WebSocket client (`ws://:9090` per INFRA.md).
 *
 * Protocol (from infra docs):
 *   1. Connect to `ws://host:9090` with `Authorization: Bearer <key>` (or `?api_key=…`).
 *   2. Send JSON header: `{ uid, language }`.
 *   3. Server replies: `{ type: "ready", uid }`.
 *   4. Stream binary float32 mono 16 kHz PCM frames.
 *   5. Receive `{ type: "speech_end" }` then `{ type: "transcript" }` per VAD segment.
 *   6. Send ≥400 ms of silence before close to flush trailing speech.
 *
 * Works in Node (via `ws` peer dep) and browser (native WebSocket — auth via `?api_key=`).
 */
import { asrStreamConfig, type AsrStreamConfig } from "./config.js";

export type ServerEvent =
  | { type: "ready"; uid: string }
  | { type: "speech_end"; uid: string; samples: number; start: number; end: number }
  | {
      type: "transcript";
      uid: string;
      text: string;
      language: string;
      language_probability: number;
      duration_audio: number;
      queue_ms: number;
      infer_ms: number;
      wall_ms: number;
    }
  | { type: "error"; uid: string; error: string };

export interface StreamSessionOpts {
  uid: string;
  language?: string;
  onEvent?: (e: ServerEvent) => void;
  onError?: (err: unknown) => void;
  onClose?: (code: number, reason: string) => void;
  /** Override WebSocket constructor (e.g. inject `ws` in Node). Auto-detected otherwise. */
  WebSocketImpl?: typeof WebSocket;
}

export interface AsrStream {
  ready: Promise<void>;
  /** Send a chunk of float32 mono 16 kHz PCM. */
  sendPcm(pcm: Float32Array): void;
  /** Send `silenceMs` of silence then close (lets VAD flush trailing segment). */
  flushAndClose(silenceMs?: number): Promise<void>;
  close(): void;
}

export class AsrStreamClient {
  readonly cfg: AsrStreamConfig;
  constructor(overrides: Partial<AsrStreamConfig> = {}) {
    this.cfg = asrStreamConfig(overrides);
  }

  /** Compose URL with query-string auth (works for browser WebSocket which can't set headers). */
  url(): string {
    const u = new URL(this.cfg.url);
    u.searchParams.set("api_key", this.cfg.apiKey);
    return u.toString();
  }

  async open(opts: StreamSessionOpts): Promise<AsrStream> {
    const Impl = opts.WebSocketImpl ?? (await pickWebSocket());
    // For Node (ws library), pass headers; in browser, auth is via query string only.
    const wsUrl = this.url();
    const isNodeWs = isNodeWsConstructor(Impl);
    const ws: any = isNodeWs
      ? new (Impl as any)(wsUrl, { headers: { Authorization: `Bearer ${this.cfg.apiKey}` } })
      : new (Impl as any)(wsUrl);
    if ("binaryType" in ws) (ws as { binaryType: string }).binaryType = "arraybuffer";

    let resolveReady!: () => void;
    let rejectReady!: (e: unknown) => void;
    const ready = new Promise<void>((res, rej) => { resolveReady = res; rejectReady = rej; });

    const send = (payload: unknown) => ws.send(typeof payload === "string" ? payload : (payload as ArrayBufferLike));

    ws.onopen = () => {
      send(JSON.stringify({ uid: opts.uid, language: opts.language ?? this.cfg.language ?? "es" }));
    };
    ws.onmessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (typeof data !== "string") return; // server only sends text frames
      let event: ServerEvent;
      try { event = JSON.parse(data); } catch { return; }
      if (event.type === "ready") resolveReady();
      opts.onEvent?.(event);
    };
    ws.onerror = (ev: Event) => { rejectReady(ev); opts.onError?.(ev); };
    ws.onclose = (ev: CloseEvent) => opts.onClose?.(ev.code, ev.reason);

    const sendPcm = (pcm: Float32Array) => {
      if (ws.readyState !== 1 /* OPEN */) return;
      ws.send(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
    };

    return {
      ready,
      sendPcm,
      flushAndClose: async (silenceMs = 500) => {
        const samples = Math.ceil((silenceMs / 1000) * 16000);
        sendPcm(new Float32Array(samples));
        await new Promise(r => setTimeout(r, silenceMs + 1200));
        ws.close(1000, "client flush");
      },
      close: () => ws.close(1000, "client close"),
    };
  }
}

async function pickWebSocket(): Promise<typeof WebSocket> {
  if (typeof WebSocket !== "undefined") return WebSocket;
  // Lazy import for Node — keeps `ws` an optional peer dep.
  const mod: any = await import("ws").catch(() => {
    throw new Error("`ws` package required in Node — `npm i ws` or pass WebSocketImpl");
  });
  return mod.default ?? mod.WebSocket ?? mod;
}

function isNodeWsConstructor(C: any): boolean {
  // Heuristic: native browser WebSocket has `WebSocket.CONNECTING` static and lives on globalThis.
  // ws (node) doesn't accept second arg of `options` object the same way browser WebSocket does.
  return typeof globalThis !== "undefined" && (globalThis as any).WebSocket !== C;
}

export const asrStream = (overrides: Partial<AsrStreamConfig> = {}) => new AsrStreamClient(overrides);
