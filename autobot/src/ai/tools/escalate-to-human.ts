import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { pauseContact } from '../../db/ai-paused-repo.js';
import { getTenantId, getJid, type YayaToolContext } from './types.js';
import { logger } from '../../shared/logger.js';

/**
 * Agent-callable escalation tool. Pauses AI for the customer contact
 * so subsequent messages pass through to the owner directly.
 */
export const escalateToHumanTool = createTool({
  id: 'escalate_to_human',
  description:
    'Transfer this conversation to a human agent. Use ONLY when: ' +
    '(1) the customer explicitly asks to speak with a person, or ' +
    '(2) you have failed 2+ times to resolve their issue with tools. ' +
    'After calling this, tell the customer that someone will be with them shortly.',
  inputSchema: z.object({
    reason: z.string().describe('Brief reason for the escalation'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);

    await pauseContact(tenantId, jid);

    logger.info({ tenantId, jid, reason: input.reason }, 'Conversation escalated to human');

    return 'Conversation has been transferred to the business owner. Tell the customer that someone from the team will attend them shortly.';
  },
});
