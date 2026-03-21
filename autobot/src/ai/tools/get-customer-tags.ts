import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const getCustomerTagsTool = createTool({
  id: 'get_customer_tags',
  description: 'Get the current tags assigned to this customer. Useful for personalizing the conversation.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const customer = await customersRepo.getCustomerByJid(tenantId, jid, channel);
    if (!customer) return JSON.stringify({ tags: [], message: 'Customer not yet registered.' });
    return JSON.stringify({ tags: customer.tags, customerId: customer.id });
  },
});
