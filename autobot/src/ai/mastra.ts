import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  DATABASE_URL,
  AI_BASE_URL,
  AI_MODEL,
  AI_API_KEY,
} from '../config.js';

// Model config type for OpenAI-compatible endpoints (used by Mastra Agent)
type OpenAICompatibleModel = {
  id: `${string}/${string}`;
  url?: string;
  apiKey?: string;
};

// ── PostgreSQL Storage (shared across all agents) ──

export const pgStore = new PostgresStore({
  id: 'yaya-store',
  connectionString: DATABASE_URL,
});

// ── Model Configuration ──

export const textModel: OpenAICompatibleModel = {
  id: `deepseek/${AI_MODEL}` as `${string}/${string}`,
  url: AI_BASE_URL,
  apiKey: AI_API_KEY,
};

// AI SDK model instance for direct generateText/streamText calls (non-agent use)
const deepseekProvider = createOpenAICompatible({
  name: 'deepseek',
  baseURL: AI_BASE_URL,
  apiKey: AI_API_KEY,
});
export const aiModel: ReturnType<typeof deepseekProvider.chatModel> = deepseekProvider.chatModel(AI_MODEL);

// ── Sales Agent Memory (working memory scoped per customer) ──

export const salesMemory = new Memory({
  options: {
    lastMessages: 20,
    workingMemory: {
      enabled: true,
      template: `## Customer Profile
- Name:
- Location/Address:
- Communication style:

## Preferences
- Favorite products:
- Usual order:
- Payment preference:
- Delivery preferences:

## Purchase Patterns
- Frequency:
- Last order summary:

## Notes
- Restrictions/allergies:
- Past complaints:
- Special instructions:
`,
    },
    observationalMemory: {
      scope: 'resource', // Cross-thread — memories persist across sessions per customer
      model: textModel,  // Reuse DeepSeek (default is gemini-2.5-flash which needs separate key)
    },
  },
});

salesMemory.setStorage(pgStore);

// ── Owner Agent Memory (working memory scoped per owner session) ──

export const ownerMemory = new Memory({
  options: {
    lastMessages: 20,
    workingMemory: {
      enabled: true,
      template: `## Business Owner Context
- Onboarding status:
- Preferred language:
- Common queries:
- Last config changes:
`,
    },
  },
});

ownerMemory.setStorage(pgStore);

// ── Initialize storage tables ──

export async function initMastraStorage(): Promise<void> {
  await pgStore.init();
}
