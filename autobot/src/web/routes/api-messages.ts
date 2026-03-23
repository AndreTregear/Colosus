import { Router } from 'express';
import * as messagesRepo from '../../db/pg-messages-repo.js';
import { decryptRecords } from '../../crypto/middleware.js';

const router = Router();

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const jid = req.query.jid as string | undefined;

  if (jid) {
    const result = await messagesRepo.getConversationMessages(DEFAULT_TENANT_ID, jid, limit, offset);
    // Decrypt body and push_name in message_log records
    const decryptedMessages = await decryptRecords(DEFAULT_TENANT_ID, 'message_log', result.messages as unknown as Record<string, unknown>[]);
    res.json({ messages: decryptedMessages, total: result.total, limit, offset });
  } else {
    const { conversations, total } = await messagesRepo.getConversationList(DEFAULT_TENANT_ID, limit, offset);
    // Decrypt lastMessage (from body) and customerName (from customers.name) in conversation summaries
    const decrypted = await decryptRecords(DEFAULT_TENANT_ID, 'message_log', conversations as unknown as Record<string, unknown>[]);
    res.json({ conversations: decrypted, total, limit, offset });
  }
});

export { router as messagesRouter };
