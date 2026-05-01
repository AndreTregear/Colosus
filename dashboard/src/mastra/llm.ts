/**
 * LLM provider configuration for Mastra agents.
 * Points to local vLLM and HPC endpoints.
 */

import { createOpenAI } from '@ai-sdk/openai';

export const localLLM = createOpenAI({
  apiKey: process.env.VLLM_API_KEY || 'omnimoney',
  baseURL: process.env.VLLM_API_BASE || 'http://localhost:8000/v1',
});

export const hpcLLM = createOpenAI({
  apiKey: process.env.HPC_API_KEY || 'omnimoney',
  baseURL: process.env.HPC_GPU1_URL || 'http://localhost:18080/v1',
});

export const localModel = localLLM(process.env.VLLM_MODEL || 'qwen3.5-35b-a3b');
export const hpcModel = hpcLLM('qwen3.5-122b');
