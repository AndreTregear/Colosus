import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as settingsRepo from '../../db/settings-repo.js';
import * as tenantsRepo from '../../db/tenants-repo.js';
import { BUSINESS_NAME, BUSINESS_CURRENCY, YAPE_NUMBER, YAPE_NAME } from '../../config.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const getBusinessInfoTool = createTool({
  id: 'get_business_info',
  description: 'Get information about the business including name, payment methods, and currency. Use this when a customer asks about the business or you need payment details.',
  inputSchema: z.object({}),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const tenant = await tenantsRepo.getTenantById(tenantId);
    const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number', YAPE_NUMBER);
    const yapeName = await settingsRepo.getEffectiveSetting(tenantId, 'yape_name', YAPE_NAME);
    const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);
    const customPrompt = await settingsRepo.getSetting(tenantId, 'system_prompt');

    return JSON.stringify({
      businessName: tenant?.name || BUSINESS_NAME,
      currency,
      paymentMethods: {
        yape: { number: yapeNumber, name: yapeName },
      },
      customInstructions: customPrompt || null,
    });
  },
});
