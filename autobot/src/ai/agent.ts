import { Agent } from '@mastra/core/agent';
import { RequestContext } from '@mastra/core/request-context';
import { getToolsForBusiness } from './tools/registry.js';
import { buildSystemPrompt } from './system-prompt.js';
import { getBusinessType } from './flows/resolver.js';
import { collectImageResults } from './image-collector.js';
import { textModel, salesMemory } from './mastra.js';
import { AI_AGENT_MAX_ITERATIONS } from '../config.js';
import { logger } from '../shared/logger.js';
import type { BusinessType } from './flows/types.js';
import type { YayaRequestContext } from './tools/types.js';

const FALLBACK_REPLY = 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';

// ── 4 Specialized Sales Agents (one per business type) ──

function createSalesAgent(businessType: BusinessType) {
  return new Agent({
    id: `sales-${businessType}`,
    name: `Sales Agent (${businessType})`,
    model: textModel,
    tools: getToolsForBusiness(businessType),
    instructions: async ({ requestContext }) => {
      const tenantId = requestContext?.get('tenantId') as string;
      return buildSystemPrompt(tenantId, businessType);
    },
    memory: salesMemory,
  });
}

const agents: Record<BusinessType, ReturnType<typeof createSalesAgent>> = {
  retail: createSalesAgent('retail'),
  service: createSalesAgent('service'),
  delivery: createSalesAgent('delivery'),
  lead_capture: createSalesAgent('lead_capture'),
};

// ── Public API ──

export interface AIProcessResult {
  reply: string;
  imagesToSend: Array<{ imagePath: string; caption: string }>;
}

// ── Streaming API ──

/**
 * Process a customer message with streaming — sends WhatsApp chunks as text generates.
 * Customers see the first reply in ~2-3s instead of waiting 5-15s for the full response.
 */
export async function processWithAIStreaming(
  tenantId: string,
  channel: string,
  jid: string,
  userMessage: string,
  sendChunk: (text: string) => Promise<void>,
  imageMediaPath?: string,
): Promise<AIProcessResult> {
  const businessType = await getBusinessType(tenantId);
  const agent = agents[businessType];

  const requestContext = new RequestContext<YayaRequestContext>();
  requestContext.set('tenantId', tenantId);
  requestContext.set('channel', channel);
  requestContext.set('jid', jid);

  const threadId = `${tenantId}:${channel}:${jid}`;
  const resourceId = `${tenantId}:${jid}`;

  const messages: string[] = imageMediaPath
    ? [`${userMessage}\n[Image: ${imageMediaPath}]`]
    : [userMessage];

  try {
    logger.debug({ tenantId, jid, businessType, threadId, messageLength: userMessage.length, hasImage: !!imageMediaPath, maxSteps: AI_AGENT_MAX_ITERATIONS }, 'Starting AI agent stream');
    const agentStart = Date.now();

    const result = await agent.stream(messages, {
      maxSteps: AI_AGENT_MAX_ITERATIONS,
      requestContext,
      memory: { thread: threadId, resource: resourceId },
    });

    const fullText = await streamAndSend(result.textStream, sendChunk);
    const steps = await result.steps;
    const imagesToSend = collectImageResults(steps ?? []);

    logger.debug({ tenantId, jid, replyLength: fullText.length, stepsCount: steps?.length ?? 0, imagesCount: imagesToSend.length, latencyMs: Date.now() - agentStart }, 'AI agent stream completed');

    return { reply: fullText, imagesToSend };
  } catch (err) {
    logger.error({ err, tenantId, jid }, 'Sales agent streaming failed');
    return { reply: FALLBACK_REPLY, imagesToSend: [] };
  }
}

/**
 * Buffer streaming text and send chunks at natural break points.
 */
async function streamAndSend(
  textStream: ReadableStream<string>,
  sendChunk: (text: string) => Promise<void>,
): Promise<string> {
  const reader = textStream.getReader();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      fullText += value;

      const breakIdx = findNaturalBreak(buffer);
      if (breakIdx > 0) {
        const chunk = cleanResponse(buffer.substring(0, breakIdx));
        if (chunk.trim()) await sendChunk(chunk);
        buffer = buffer.substring(breakIdx);
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const chunk = cleanResponse(buffer);
      if (chunk.trim()) await sendChunk(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

/**
 * Find a natural break point in buffered text for chunked sending.
 * Returns the index to split at, or -1 if no good break found yet.
 */
function findNaturalBreak(text: string): number {
  if (text.length < 200) return -1;

  // Prefer paragraph breaks (double newline)
  const para = text.lastIndexOf('\n\n');
  if (para >= 150) return para + 2;

  // Sentence end (period/question/exclamation followed by space or newline)
  const sent = text.search(/[.!?]\s/);
  if (sent >= 150) return sent + 2;

  // Force break at 800 chars to avoid excessive buffering
  if (text.length > 800) {
    const nl = text.lastIndexOf('\n', 800);
    if (nl >= 100) return nl + 1;
    return 800;
  }

  return -1;
}

// ── Response Cleaner ──

/**
 * Strip leaked chain-of-thought, tool-call narration, and internal reasoning
 * from the agent's response before sending to the customer.
 */
function cleanResponse(text: string | undefined): string {
  if (!text) return '';

  let cleaned = text;

  // Remove <think>...</think> blocks (DeepSeek R1 / reasoning models)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Remove lines that narrate tool usage
  const toolNarrationPatterns = [
    /^(?:let me|i'?ll|i will|i need to|i(?:'?m going to|'m gonna)) (?:search|check|look|find|use|call|query|fetch|retrieve|get|verify|confirm with).*$/gim,
    /^(?:searching|checking|looking|finding|using|calling|querying|fetching|retrieving|getting|verifying).*$/gim,
    /^(?:based on|according to) (?:the|my) (?:search|tool|results?|data|records?|system|database).*$/gim,
    /^(?:the (?:search|tool|system|database) (?:shows?|returns?|indicates?|found|reveals?)).*$/gim,
    /^(?:tool call|function call|calling function|executing):?\s.*$/gim,
    /^(?:result|output|response) (?:from|of) (?:the )?\w+[\s_]?tool:?\s.*$/gim,
  ];

  for (const pattern of toolNarrationPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Collapse multiple blank lines into one
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
