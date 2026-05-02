/**
 * `@yaya/clients` — composable, env-overridable clients for the Yaya voice stack.
 *
 * One import for the whole infra: `import { llm, asr, asrStream, tts } from "@yaya/clients"`.
 *
 * Every client reads `YAYA_<SVC>_URL` / `YAYA_<SVC>_KEY` from the environment, with
 * legacy aliases (VLLM_API_BASE, WHISPER_BASE_URL, …) honored for back-compat.
 * Pass overrides per-instance to point at a different endpoint at runtime:
 *
 *     const remote = llm({ url: "https://ai.yaya.sh/v1", apiKey: process.env.PROD_KEY });
 */
export * from "./config.js";
export * from "./llm.js";
export * from "./asr.js";
export * from "./asr-stream.js";
export * from "./tts.js";

import { LLMClient } from "./llm.js";
import { AsrClient } from "./asr.js";
import { AsrStreamClient } from "./asr-stream.js";
import { TtsClient } from "./tts.js";
import type { LLMConfig, AsrConfig, AsrStreamConfig, TtsConfig } from "./config.js";

export interface YayaClientsOverrides {
  llm?: Partial<LLMConfig>;
  asr?: Partial<AsrConfig>;
  asrStream?: Partial<AsrStreamConfig>;
  tts?: Partial<TtsConfig>;
}

export interface YayaClients {
  llm: LLMClient;
  asr: AsrClient;
  asrStream: AsrStreamClient;
  tts: TtsClient;
}

/** Build all four clients in one go (each still resolved independently from env). */
export const createYayaClients = (overrides: YayaClientsOverrides = {}): YayaClients => ({
  llm:       new LLMClient(overrides.llm),
  asr:       new AsrClient(overrides.asr),
  asrStream: new AsrStreamClient(overrides.asrStream),
  tts:       new TtsClient(overrides.tts),
});
