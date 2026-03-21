/**
 * Unified Owner Agent — replaces both admin-agent.ts and merchant-agent.ts.
 *
 * Single agent handles ALL owner interactions:
 * - Onboarding (business description, type, tone, hours)
 * - Config updates (via update_business_config tool — replaces ---EXTRACTION--- hack)
 * - Analytics (sales, revenue, top products, customer insights)
 * - Actions (create/update products, send reminders, manage customers)
 *
 * Owner routing no longer uses keyword heuristic (detectOwnerIntent).
 * The LLM naturally handles both analytics and config in one conversation.
 */

import { Agent } from '@mastra/core/agent';
import { RequestContext } from '@mastra/core/request-context';
import * as businessContextRepo from '../db/business-context-repo.js';
import * as tenantsRepo from '../db/tenants-repo.js';
import { ownerTools } from './tools/registry.js';
import { textModel, ownerMemory } from './mastra.js';
import { logger } from '../shared/logger.js';
import type { YayaRequestContext } from './tools/types.js';

// ── Owner Agent ──

const ownerAgent = new Agent({
  id: 'owner-agent',
  name: 'Owner Agent',
  model: textModel,
  tools: ownerTools,
  instructions: async ({ requestContext }) => {
    const tenantId = requestContext?.get('tenantId') as string;
    return buildOwnerInstructions(tenantId);
  },
  memory: ownerMemory,
});

// ── Public API ──

/**
 * Process a message from the business owner.
 */
export async function processWithOwnerAI(
  tenantId: string,
  ownerJid: string,
  text: string,
): Promise<{ reply: string }> {
  const requestContext = new RequestContext<YayaRequestContext>();
  requestContext.set('tenantId', tenantId);
  requestContext.set('channel', 'whatsapp');
  requestContext.set('jid', ownerJid);

  // Daily thread for owner conversations
  const today = new Date().toISOString().split('T')[0];
  const threadId = `owner:${tenantId}:${today}`;
  const resourceId = `owner:${tenantId}`;

  try {
    const response = await ownerAgent.generate(
      [text],
      {
        maxSteps: 10,
        requestContext,
        memory: {
          thread: threadId,
          resource: resourceId,
        },
      },
    );

    return { reply: response.text || 'Entendido. ¿Hay algo más que necesites?' };
  } catch (err) {
    logger.error({ err, tenantId, ownerJid }, 'Owner agent failed');
    return { reply: 'Lo siento, hubo un error. Intenta de nuevo.' };
  }
}

/**
 * Check if this JID is the business owner (self-chat).
 * Extracted from old AdminAgent.isSelfChat() method.
 */
export async function isOwnerChat(tenantId: string, jid: string): Promise<boolean> {
  const settings = await businessContextRepo.getAdminSettings(tenantId);

  // If owner is already set, check against it
  if (settings?.ownerJid) {
    return businessContextRepo.isOwner(tenantId, jid);
  }

  // Auto-detect: If no owner set and auto-detect is enabled,
  // check if this JID matches the tenant's phone number
  if (settings?.autoDetectOwner !== false) {
    const tenant = await tenantsRepo.getTenantById(tenantId);
    if (tenant?.phone) {
      const normalizedTenantPhone = tenant.phone.replace(/\D/g, '');
      const normalizedJid = jid.split('@')[0].replace(/\D/g, '');

      if (normalizedTenantPhone === normalizedJid) {
        await businessContextRepo.setOwnerJid(tenantId, jid);
        logger.info({ tenantId, ownerJid: jid }, 'Auto-detected owner from self-chat');
        return true;
      }
    }
  }

  return false;
}

// ── Instructions Builder ──

async function buildOwnerInstructions(tenantId: string): Promise<string> {
  const businessContext = await businessContextRepo.getBusinessContext(tenantId);
  const tenant = await tenantsRepo.getTenantById(tenantId);
  const businessName = businessContext?.businessName || tenant?.name || 'tu negocio';
  const isOnboarding = !businessContext?.businessDescription;

  if (isOnboarding) {
    return `Eres el asistente de configuración para "${businessName}".

Tu trabajo es ayudar al dueño a configurar su negocio para que la IA atienda correctamente a sus clientes.

Necesitas obtener:
- Descripción del negocio (qué vende/ofrece)
- Tipo de negocio (retail, delivery, service, lead_capture)
- Tono de comunicación (friendly, professional, casual, formal)
- Horarios de atención
- Instrucciones especiales

Cuando el dueño comparta información, usa la herramienta update_business_config para guardarla.
Sé conversacional y amigable. Pregunta de forma natural, no como un formulario.
Responde siempre en español.`;
  }

  const contextParts: string[] = [];
  if (businessContext?.businessDescription) contextParts.push(`Descripción: ${businessContext.businessDescription}`);
  if (businessContext?.businessType) contextParts.push(`Tipo: ${businessContext.businessType}`);
  if (businessContext?.toneOfVoice) contextParts.push(`Tono: ${businessContext.toneOfVoice}`);
  if (businessContext?.servicesOffered?.length) contextParts.push(`Servicios: ${businessContext.servicesOffered.join(', ')}`);
  if (businessContext?.specialInstructions) contextParts.push(`Instrucciones: ${businessContext.specialInstructions}`);

  return `Eres el asistente personal del dueño de "${businessName}".

Información del negocio:
${contextParts.join('\n')}

Puedes:
- Dar resúmenes de ventas, ingresos, productos top, clientes
- Gestionar productos (crear, actualizar, stock)
- Enviar recordatorios de pago a clientes
- Ver pagos pendientes y detalles de clientes
- Actualizar configuración del negocio (usa update_business_config)
- Dar análisis de salud del negocio
- Buscar conversaciones con clientes
- Comparar métricas entre periodos

Sé directo y conciso. Usa números y datos. Responde en español.
Cuando el dueño pida algo que requiera una herramienta, úsala inmediatamente.`;
}
