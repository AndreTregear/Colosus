import { Agent } from '@mastra/core/agent';
import { createOpenAI } from '@ai-sdk/openai';
import { crmTools } from './tools/crm-tools.js';
import { yapeTools } from './tools/yape-tools.js';
import { qwenNoThinkFetch } from './qwen-fetch.js';

// We point Mastra to the local vLLM OpenAI-compatible endpoint
const openai = createOpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'welcometothepresent',
  fetch: qwenNoThinkFetch,
});

const localModel = openai('cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit');

// Add all tools we want the agent to use
const allTools = {
  ...crmTools,
  ...yapeTools
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

// Simple tenant ID context holder
let currentTenantId = '';
export function setTenantId(id: string) {
  currentTenantId = id;
}
