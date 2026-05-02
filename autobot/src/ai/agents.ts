import { Agent } from '@mastra/core/agent';
import { createOpenAI } from '@ai-sdk/openai';
import { crmTools } from './tools/crm-tools.js';
import { yapeTools } from './tools/yape-tools.js';
import { yayapayTools } from './tools/yayapay-tools.js';
import { qwenNoThinkFetch } from './qwen-fetch.js';
import { AI_API_KEY, AI_BASE_URL } from '../config.js';

// Mastra → local vLLM (OpenAI-compatible). AI_API_KEY is validated at config
// load time (no placeholder fallback); reading from config keeps a single
// validation point.
const openai = createOpenAI({
  baseURL: AI_BASE_URL,
  apiKey: AI_API_KEY,
  fetch: qwenNoThinkFetch,
});

const localModel = openai('cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit');

// Add all tools we want the agent to use
const allTools = {
  ...crmTools,
  ...yapeTools,
  ...yayapayTools,
};

export const whatsappAgent = new Agent({
  id: 'WhatsappAgent',
  name: 'WhatsappAgent',
  instructions: 'Eres un agente de ventas por WhatsApp.',
  model: localModel,
  tools: allTools,
});

export const whatsappAgentHpc = whatsappAgent;

export const directAgent = new Agent({
  id: 'DirectAgent',
  name: 'DirectAgent',
  instructions: 'Eres un agente de ventas avanzado.',
  model: localModel,
  tools: allTools,
});

export const directAgentHpc = directAgent;

// Tenant context lives in tenant-context.ts (AsyncLocalStorage). Tools call
// `getCurrentTenant()`; callers wrap agent invocations in `runWithTenant`.
// Re-exported here for backwards compatibility with imports.
export { runWithTenant, getCurrentTenant } from './tenant-context.js';
