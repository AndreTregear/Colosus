/**
 * LLM provider configuration for Mastra agents.
 * Points to local vLLM and HPC endpoints.
 */

import { createOpenAI } from '@ai-sdk/openai';

// Local vLLM endpoint per INFRA.md (`:8000`, bearer `welcometothepresent`).
// Override via YAYA_LLM_* (canonical) or legacy VLLM_* env vars.
export const localLLM = createOpenAI({
  apiKey: process.env.YAYA_LLM_KEY || process.env.VLLM_API_KEY || 'welcometothepresent',
  baseURL: process.env.YAYA_LLM_URL || process.env.VLLM_API_BASE || 'http://localhost:8000/v1',
});

export const hpcLLM = createOpenAI({
  apiKey: process.env.HPC_API_KEY || process.env.YAYA_LLM_KEY || 'welcometothepresent',
  baseURL: process.env.HPC_GPU1_URL || 'http://localhost:18080/v1',
});

export const localModel = localLLM(process.env.YAYA_LLM_MODEL || process.env.VLLM_MODEL || 'cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit');
export const hpcModel = hpcLLM('qwen3.5-122b');
