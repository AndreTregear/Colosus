/**
 * Resolves URL + API key for each Yaya voice service from env vars.
 *
 * Canonical names: YAYA_LLM_URL / YAYA_LLM_KEY / YAYA_LLM_MODEL, etc.
 * Legacy aliases (VLLM_API_BASE, WHISPER_BASE_URL, TTS_BASE_URL, …) are
 * still honored so existing autobot/dashboard configs keep working.
 *
 * Defaults align with INFRA.md (snapshot 2026-04-30): everything localhost,
 * all four services authenticated with the bearer `welcometothepresent`.
 */

const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;

const pick = (...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = env[k];
    if (v != null && v !== "") return v;
  }
  return undefined;
};

export const DEFAULT_API_KEY = "welcometothepresent";

export interface ServiceConfig {
  url: string;
  apiKey: string;
}

export interface LLMConfig extends ServiceConfig {
  model: string;
}
export interface AsrConfig extends ServiceConfig {
  model: string;
  language?: string;
}
export interface AsrStreamConfig extends ServiceConfig {
  language?: string;
}
export interface TtsConfig extends ServiceConfig {
  voice: string;
  model: string;
  format: string;
  sampleRate: number;
}

export const llmConfig = (overrides: Partial<LLMConfig> = {}): LLMConfig => ({
  url:    overrides.url    ?? pick("YAYA_LLM_URL", "VLLM_API_BASE", "VLLM_URL")     ?? "http://localhost:8000/v1",
  apiKey: overrides.apiKey ?? pick("YAYA_LLM_KEY", "VLLM_API_KEY")                  ?? DEFAULT_API_KEY,
  model:  overrides.model  ?? pick("YAYA_LLM_MODEL", "VLLM_MODEL")                  ?? "cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit",
});

export const asrConfig = (overrides: Partial<AsrConfig> = {}): AsrConfig => ({
  url:      overrides.url      ?? pick("YAYA_ASR_URL", "SPEACHES_URL", "WHISPER_BASE_URL", "WHISPER_URL")
                                ?? "http://localhost:8001",
  apiKey:   overrides.apiKey   ?? pick("YAYA_ASR_KEY", "SPEACHES_API_KEY", "WHISPER_API_KEY")
                                ?? DEFAULT_API_KEY,
  model:    overrides.model    ?? pick("YAYA_ASR_MODEL", "WHISPER_MODEL")
                                ?? "deepdml/faster-whisper-large-v3-turbo-ct2",
  language: overrides.language ?? pick("YAYA_ASR_LANG", "WHISPER_LANGUAGE"),
});

export const asrStreamConfig = (overrides: Partial<AsrStreamConfig> = {}): AsrStreamConfig => ({
  url:      overrides.url      ?? pick("YAYA_ASR_WS_URL", "STREAMING_ASR_URL")
                                ?? "ws://localhost:8003",
  apiKey:   overrides.apiKey   ?? pick("YAYA_ASR_WS_KEY", "YAYA_ASR_KEY", "STREAMING_ASR_KEY")
                                ?? DEFAULT_API_KEY,
  language: overrides.language ?? pick("YAYA_ASR_LANG"),
});

export const ttsConfig = (overrides: Partial<TtsConfig> = {}): TtsConfig => ({
  url:        overrides.url        ?? pick("YAYA_TTS_URL", "KOKORO_URL", "TTS_BASE_URL", "TTS_URL")
                                    ?? "http://localhost:8002",
  apiKey:     overrides.apiKey     ?? pick("YAYA_TTS_KEY", "KOKORO_API_KEY", "TTS_API_KEY")
                                    ?? DEFAULT_API_KEY,
  voice:      overrides.voice      ?? pick("YAYA_TTS_VOICE", "TTS_VOICE")            ?? "ef_dora",
  model:      overrides.model      ?? pick("YAYA_TTS_MODEL", "TTS_MODEL")            ?? "kokoro",
  format:     overrides.format     ?? pick("YAYA_TTS_FORMAT", "TTS_FORMAT")          ?? "mp3",
  sampleRate: overrides.sampleRate ?? Number(pick("YAYA_TTS_SAMPLE_RATE")            ?? 24000),
});

export const authHeaders = (apiKey: string): Record<string, string> => ({
  Authorization: `Bearer ${apiKey}`,
});

export const trimSlash = (s: string) => s.replace(/\/+$/, "");
