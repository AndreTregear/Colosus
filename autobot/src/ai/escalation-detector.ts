import { getAIClient, getModelId } from './client.js';
import { logger } from '../shared/logger.js';

export interface EscalationCheck {
  shouldEscalate: boolean;
  reason?: EscalationReason;
  confidence: number;
  conciliationMessage?: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
}

export type EscalationReason = 
  | 'explicit_request'
  | 'repeated_failure'
  | 'persistent_negative'
  | 'out_of_scope'
  | 'high_risk';

export interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  toolCalls: Array<{ tool: string; success: boolean; error?: string }>;
  businessType: 'retail' | 'service' | 'delivery';
}

const CONCILIATION_PROMPT = `You are a warm, helpful assistant for a small business. The customer seems frustrated or the AI is struggling to help.

Your job: Write ONE conciliation message that:
1. Acknowledges their frustration or need
2. Offers a solution or asks a clarifying question
3. Shows empathy and warmth
4. Only mentions human handoff as last resort

Examples:
Customer: "No entiendo, esto no funciona"
Response: "Disculpa la confusión 😊 Déjame ayudarte mejor. ¿Podrías contarme exactamente qué necesitas? Estoy aquí para resolverlo."

Customer: "Quiero hablar con una persona"
Response: "Entiendo perfectamente. Déjame ver cómo puedo ayudarte rápidamente, y si necesitas hablar directamente con {{merchantName}}, te conecto enseguida. ¿En qué te puedo asistir primero?"

Customer: [After 2 failed tool calls]
Response: "Veo que hay un problemita técnico. Déjame intentar de otra forma. Mientras tanto, ¿me das un momento más para resolver esto?"

Write ONLY the response message. No prefixes, no explanations. Just the message.`;

const ESCALATION_DETECTION_PROMPT = `Analyze this conversation and determine if the AI should escalate to a human.

Escalation triggers (LAST RESORT only):
1. EXPLICIT_REQUEST: Customer explicitly asks for human ("quiero hablar con alguien", "pasame con tu jefe", "atención humana")
2. REPEATED_FAILURE: 2+ tool calls failed in this conversation
3. PERSISTENT_NEGATIVE: Customer shows negative sentiment in 2+ consecutive messages after conciliation
4. OUT_OF_SCOPE: Request is clearly outside business scope (legal advice, medical diagnosis, etc.)
5. HIGH_RISK: Sensitive topic (complaint about safety, legal threat, etc.)

Conciliation first: If customer is frustrated but hasn't explicitly asked for human, suggest conciliation instead.

Analyze:
- Latest user message
- Conversation history
- Failed tool calls
- Sentiment progression

Respond in JSON:
{
  "shouldEscalate": boolean,
  "reason": "explicit_request" | "repeated_failure" | "persistent_negative" | "out_of_scope" | "high_risk" | null,
  "confidence": 0-1,
  "sentiment": "positive" | "neutral" | "negative" | "angry",
  "suggestConciliation": boolean,
  "conciliationContext": "why customer is frustrated"
}`;

export async function checkEscalationNeeded(
  context: ConversationContext,
  merchantName: string
): Promise<EscalationCheck> {
  const client = getAIClient();

  const analysisPrompt = buildAnalysisPrompt(context);

  try {
    const response = await client.chat.completions.create({
      model: getModelId(),
      messages: [
        { role: 'system', content: ESCALATION_DETECTION_PROMPT },
        { role: 'user', content: analysisPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { shouldEscalate: false, confidence: 0, sentiment: 'neutral' };
    }

    const analysis = JSON.parse(content) as {
      shouldEscalate: boolean;
      reason: EscalationReason | null;
      confidence: number;
      sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
      suggestConciliation: boolean;
      conciliationContext: string;
    };

    // If escalation needed but we should try conciliation first
    if (analysis.shouldEscalate && analysis.suggestConciliation && analysis.reason !== 'explicit_request') {
      const conciliationMessage = await generateConciliationMessage(
        context,
        analysis.conciliationContext,
        merchantName
      );

      return {
        shouldEscalate: false, // Defer escalation
        reason: analysis.reason || undefined,
        confidence: analysis.confidence,
        conciliationMessage,
        sentiment: analysis.sentiment,
      };
    }

    // True escalation needed
    if (analysis.shouldEscalate) {
      return {
        shouldEscalate: true,
        reason: analysis.reason || undefined,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
      };
    }

    // No escalation needed
    return {
      shouldEscalate: false,
      confidence: analysis.confidence,
      sentiment: analysis.sentiment,
    };

  } catch (error) {
    logger.error({ error }, 'Error in escalation detection');
    // Fail safe: don't escalate on error
    return {
      shouldEscalate: false,
      confidence: 0,
      sentiment: 'neutral',
    };
  }
}

async function generateConciliationMessage(
  context: ConversationContext,
  frustrationContext: string,
  merchantName: string
): Promise<string> {
  const client = getAIClient();

  const recentMessages = context.messages.slice(-3).map(m => 
    `${m.role}: ${m.content}`
  ).join('\n');

  try {
    const response = await client.chat.completions.create({
      model: getModelId(),
      messages: [
        { role: 'system', content: CONCILIATION_PROMPT.replace('{{merchantName}}', merchantName) },
        { 
          role: 'user', 
          content: `Recent messages:\n${recentMessages}\n\nContext: ${frustrationContext}` 
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || getDefaultConciliationMessage();
  } catch {
    return getDefaultConciliationMessage();
  }
}

function buildAnalysisPrompt(context: ConversationContext): string {
  const messages = context.messages.slice(-6).map(m => 
    `[${m.role.toUpperCase()}]: ${m.content}`
  ).join('\n');

  const failedTools = context.toolCalls
    .filter(t => !t.success)
    .map(t => `${t.tool}: ${t.error || 'failed'}`)
    .join(', ');

  return `Business type: ${context.businessType}

Recent conversation:
${messages}

Failed tool calls: ${failedTools || 'none'}

Analyze and respond with JSON.`;
}

function getDefaultConciliationMessage(): string {
  return "Disculpa si hay alguna confusión 😊 Déjame ayudarte mejor. ¿En qué específicamente te puedo apoyar?";
}

// Track escalation attempts per conversation to prevent spam
const escalationAttempts = new Map<string, {
  attempts: number;
  lastAttempt: Date;
  alreadyEscalated: boolean;
}>();

export function recordEscalationAttempt(conversationId: string): void {
  const current = escalationAttempts.get(conversationId);
  if (current) {
    current.attempts++;
    current.lastAttempt = new Date();
  } else {
    escalationAttempts.set(conversationId, {
      attempts: 1,
      lastAttempt: new Date(),
      alreadyEscalated: false,
    });
  }
}

export function markEscalated(conversationId: string): void {
  const current = escalationAttempts.get(conversationId);
  if (current) {
    current.alreadyEscalated = true;
  } else {
    escalationAttempts.set(conversationId, {
      attempts: 1,
      lastAttempt: new Date(),
      alreadyEscalated: true,
    });
  }
}

export function shouldAttemptEscalation(conversationId: string): boolean {
  const record = escalationAttempts.get(conversationId);
  if (!record) return true;
  if (record.alreadyEscalated) return false;
  
  // Limit to 2 escalation attempts per conversation
  return record.attempts < 2;
}

// Cleanup old records periodically
setInterval(() => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
  for (const [id, record] of escalationAttempts.entries()) {
    if (record.lastAttempt < cutoff) {
      escalationAttempts.delete(id);
    }
  }
}, 60 * 60 * 1000); // Every hour
