/**
 * CEO Supervisor Agent
 *
 * Coordinates all worker agents. This is the main agent that users interact with.
 * For voice mode: use directAgent (no sub-agents, minimum latency).
 * For chat/tasks: use supervisorAgent (delegates to workers).
 */

import { Agent } from '@mastra/core/agent';
import { localModel } from '../llm';
import { allBusinessTools } from '../tools/business';
import { metricsAgent, schedulingAgent, messagingAgent, researchAgent } from './workers';

/**
 * Direct agent — all tools on one agent, no delegation overhead.
 * Used for voice mode (System 1) where every millisecond counts.
 */
export const directAgent = new Agent({
  id: 'ceo-direct',
  name: 'CEO Direct',
  instructions: 'Asistente de voz del CEO. Respuestas cortas en español. Usa herramientas para datos de negocio. No inventes números. /no_think',
  model: localModel,
  tools: allBusinessTools,
});

/**
 * Supervisor agent — delegates to specialized workers.
 * Used for chat mode and background tasks where quality > latency.
 */
export const supervisorAgent = new Agent({
  id: 'ceo-supervisor',
  name: 'CEO Supervisor',
  instructions: `Eres el asistente ejecutivo del CEO para la plataforma Yaya. Coordinas agentes especializados:
- metricsAgent: datos de ventas, ingresos, pedidos, pagos
- schedulingAgent: citas y agenda del día
- messagingAgent: enviar mensajes de WhatsApp a clientes
- researchAgent: análisis de negocio, tendencias, investigación

Delega al agente correcto según la solicitud. Combina resultados en respuestas claras.
Siempre en español latinoamericano. Sé directo y útil. /no_think`,
  model: localModel,
  agents: { metricsAgent, schedulingAgent, messagingAgent, researchAgent },
});
