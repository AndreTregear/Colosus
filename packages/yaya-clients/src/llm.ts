/**
 * vLLM client (`:8000` per INFRA.md). Wraps every endpoint vLLM exposes:
 *   - OpenAI-compat: /v1/chat/completions, /v1/completions, /v1/responses
 *   - Anthropic-compat Messages API: /v1/messages
 *   - Tokenizer: /tokenize, /detokenize
 *   - Health/metrics: /health, /ping, /metrics
 *   - Models: /v1/models
 *
 * Streaming completions return an async iterator of parsed JSON deltas.
 */
import { llmConfig, authHeaders, trimSlash, type LLMConfig } from "./config.js";

export type ChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "tool"; content: string; tool_call_id: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] };

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface FunctionTool {
  type: "function";
  function: { name: string; description?: string; parameters: Record<string, unknown> };
}

export interface ChatCompletionParams {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string | string[];
  tools?: FunctionTool[];
  tool_choice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  response_format?: { type: "json_object" } | { type: "json_schema"; json_schema: unknown };
  seed?: number;
  // pass-through escape hatch for any extra vLLM/OpenAI param
  [extra: string]: unknown;
}

export interface CompletionParams {
  model?: string;
  prompt: string | string[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stop?: string | string[];
  [extra: string]: unknown;
}

export interface MessagesParams {
  model?: string;
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
  [extra: string]: unknown;
}

export interface TokenizeParams {
  model?: string;
  prompt: string;
  add_special_tokens?: boolean;
}

export class LLMClient {
  readonly cfg: LLMConfig;
  constructor(overrides: Partial<LLMConfig> = {}) {
    this.cfg = llmConfig(overrides);
    this.cfg.url = trimSlash(this.cfg.url);
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { "Content-Type": "application/json", ...authHeaders(this.cfg.apiKey), ...extra };
  }

  private url(path: string): string {
    // Allow base ending in /v1 OR plain /. We normalize so callers never have to think.
    const base = this.cfg.url.endsWith("/v1") ? this.cfg.url.slice(0, -3) : this.cfg.url;
    return `${base}${path}`;
  }

  // --- meta -----------------------------------------------------------------
  health(): Promise<Response>  { return fetch(this.url("/health"), { headers: this.headers() }); }
  ping():   Promise<Response>  { return fetch(this.url("/ping"),   { headers: this.headers() }); }
  metrics(): Promise<string>   { return fetch(this.url("/metrics"),{ headers: this.headers() }).then(r => r.text()); }

  async listModels(): Promise<{ data: { id: string; object: string }[] }> {
    const r = await fetch(this.url("/v1/models"), { headers: this.headers() });
    if (!r.ok) throw new Error(`listModels ${r.status}: ${await r.text()}`);
    return r.json();
  }

  // --- chat / completions / messages ----------------------------------------
  chatCompletion(params: ChatCompletionParams): Promise<Response> {
    return fetch(this.url("/v1/chat/completions"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.cfg.model, ...params }),
    });
  }

  completion(params: CompletionParams): Promise<Response> {
    return fetch(this.url("/v1/completions"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.cfg.model, ...params }),
    });
  }

  responses(params: ChatCompletionParams): Promise<Response> {
    return fetch(this.url("/v1/responses"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.cfg.model, ...params }),
    });
  }

  messages(params: MessagesParams): Promise<Response> {
    return fetch(this.url("/v1/messages"), {
      method: "POST",
      headers: this.headers({ "anthropic-version": "2023-06-01" }),
      body: JSON.stringify({ model: this.cfg.model, ...params }),
    });
  }

  // --- convenience ----------------------------------------------------------
  /**
   * Convenience non-streaming chat. By default disables Qwen3 thinking via
   * `chat_template_kwargs.enable_thinking=false` so `text` is the final answer.
   * Pass `chat_template_kwargs: { enable_thinking: true }` to opt into reasoning.
   */
  async chat(params: ChatCompletionParams): Promise<{
    text: string;
    reasoning: string | null;
    finish_reason: string;
    tool_calls?: ToolCall[];
    raw: unknown;
  }> {
    const body: ChatCompletionParams = {
      chat_template_kwargs: { enable_thinking: false },
      ...params,
      stream: false,
    };
    const r = await this.chatCompletion(body);
    if (!r.ok) throw new Error(`chat ${r.status}: ${await r.text()}`);
    const data: any = await r.json();
    const msg = data?.choices?.[0]?.message ?? {};
    return {
      text: msg.content ?? msg.reasoning_content ?? msg.reasoning ?? "",
      reasoning: msg.reasoning_content ?? msg.reasoning ?? null,
      finish_reason: data?.choices?.[0]?.finish_reason ?? "stop",
      tool_calls: msg.tool_calls,
      raw: data,
    };
  }

  /** Stream OpenAI-format `data: …` SSE chunks as parsed JSON objects. */
  async *chatStream(params: ChatCompletionParams): AsyncGenerator<any, void, unknown> {
    const r = await this.chatCompletion({ ...params, stream: true });
    if (!r.ok || !r.body) throw new Error(`chatStream ${r.status}: ${await r.text().catch(() => "")}`);
    yield* sseJsonChunks(r.body);
  }

  // --- tokenizer ------------------------------------------------------------
  async tokenize(params: TokenizeParams): Promise<{ tokens: number[]; count: number }> {
    const r = await fetch(this.url("/tokenize"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.cfg.model, ...params }),
    });
    if (!r.ok) throw new Error(`tokenize ${r.status}: ${await r.text()}`);
    return r.json();
  }
  async detokenize(tokens: number[]): Promise<{ prompt: string }> {
    const r = await fetch(this.url("/detokenize"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.cfg.model, tokens }),
    });
    if (!r.ok) throw new Error(`detokenize ${r.status}: ${await r.text()}`);
    return r.json();
  }
}

// SSE reader for OpenAI-style streaming. Handles partial chunks, [DONE] sentinel.
async function* sseJsonChunks(body: ReadableStream<Uint8Array>): AsyncGenerator<any, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line || !line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try { yield JSON.parse(payload); } catch { /* keep reading */ }
    }
  }
}

export const llm = (overrides: Partial<LLMConfig> = {}) => new LLMClient(overrides);
