import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as businessContextRepo from '../../../db/business-context-repo.js';
import { getTenantId, type YayaToolContext } from '../types.js';

/**
 * Replaces the old ---EXTRACTION--- JSON hack in admin-agent.ts.
 * The agent calls this tool when the owner explicitly provides or changes
 * business configuration.
 */
export const updateBusinessConfigTool = createTool({
  id: 'update_business_config',
  description:
    'Update the business configuration when the owner explicitly provides or changes settings ' +
    'like description, business type, tone, hours, or special instructions. ' +
    'Only call this when the owner clearly states new or changed information — do not call it speculatively.',
  inputSchema: z.object({
    businessDescription: z.string().optional().describe('Business description — what the business does'),
    businessType: z.enum(['retail', 'delivery', 'service', 'lead_capture']).optional()
      .describe('Type of business'),
    servicesOffered: z.array(z.string()).optional()
      .describe('List of services the business offers'),
    productsCategories: z.array(z.string()).optional()
      .describe('Product categories'),
    toneOfVoice: z.string().optional()
      .describe('Desired tone: friendly, professional, casual, formal, etc.'),
    operatingHours: z.record(z.string(), z.object({
      open: z.string(),
      close: z.string(),
    })).optional().describe('Operating hours by day number (0=Sunday). E.g. {"1": {"open": "09:00", "close": "18:00"}}'),
    specialInstructions: z.string().optional()
      .describe('Custom instructions for the AI assistant'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const updates: Record<string, unknown> = {};
    const changed: string[] = [];

    if (input.businessDescription !== undefined) {
      updates.businessDescription = input.businessDescription;
      changed.push('descripción del negocio');
    }
    if (input.businessType !== undefined) {
      updates.businessType = input.businessType;
      changed.push('tipo de negocio');
    }
    if (input.servicesOffered !== undefined) {
      updates.servicesOffered = input.servicesOffered;
      changed.push('servicios ofrecidos');
    }
    if (input.productsCategories !== undefined) {
      updates.productsCategories = input.productsCategories;
      changed.push('categorías de productos');
    }
    if (input.toneOfVoice !== undefined) {
      updates.toneOfVoice = input.toneOfVoice;
      changed.push('tono de voz');
    }
    if (input.operatingHours !== undefined) {
      updates.operatingHours = input.operatingHours;
      changed.push('horario de atención');
    }
    if (input.specialInstructions !== undefined) {
      updates.specialInstructions = input.specialInstructions;
      changed.push('instrucciones especiales');
    }

    if (changed.length === 0) {
      return 'No changes provided.';
    }

    await businessContextRepo.updateBusinessContext(tenantId, updates, 'owner');
    return `Configuración actualizada: ${changed.join(', ')}.`;
  },
});
