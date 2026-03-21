import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const tagCustomerTool = createTool({
  id: 'tag_customer',
  description: 'Add or remove a tag on the current customer for personalization and categorization. Use tags like "vip", "frequent", "wholesale", "new", etc. based on the conversation context.',
  inputSchema: z.object({
    tag: z.string().describe('The tag to add or remove (e.g., "vip", "frequent", "wholesale")'),
    action: z.enum(['add', 'remove']).default('add').describe('Whether to add or remove the tag'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const customer = await customersRepo.getOrCreateCustomer(tenantId, jid, channel);

    if (input.action === 'remove') {
      const updated = await customersRepo.removeTag(tenantId, customer.id, input.tag);
      return updated ? `Tag "${input.tag}" removed from customer.` : 'Error: Customer not found.';
    }

    const updated = await customersRepo.addTag(tenantId, customer.id, input.tag);
    return updated
      ? `Tag "${input.tag}" added to customer. Current tags: ${updated.tags.join(', ')}`
      : 'Error: Customer not found.';
  },
});
