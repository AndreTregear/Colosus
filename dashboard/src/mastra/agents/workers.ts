/**
 * Specialized worker agents — each handles a business domain.
 * The supervisor delegates to these based on the user's request.
 */

import { Agent } from '@mastra/core/agent';
import { localModel } from '../llm';
import {
  businessMetrics,
  customerLookup,
  paymentStatus,
  calendarToday,
  sendMessage,
} from '../tools/business';

export const metricsAgent = new Agent({
  id: 'metrics-agent',
  name: 'Metrics Agent',
  instructions: 'You analyze business metrics. Use tools to fetch real data. Return structured summaries. Be concise. Spanish. /no_think',
  model: localModel,
  tools: { businessMetrics, paymentStatus },
});

export const schedulingAgent = new Agent({
  id: 'scheduling-agent',
  name: 'Scheduling Agent',
  instructions: 'You manage appointments and schedules. Use the calendar tool for real data. Be concise. Spanish. /no_think',
  model: localModel,
  tools: { calendarToday },
});

export const messagingAgent = new Agent({
  id: 'messaging-agent',
  name: 'Messaging Agent',
  instructions: 'You send WhatsApp messages to customers. Look up the customer first if needed. Be concise. Spanish. /no_think',
  model: localModel,
  tools: { sendMessage, customerLookup },
});

export const researchAgent = new Agent({
  id: 'research-agent',
  name: 'Research Agent',
  instructions: 'You research and analyze business topics. Provide thorough but concise analysis. Spanish. /no_think',
  model: localModel,
  tools: { businessMetrics, customerLookup, paymentStatus, calendarToday },
});
