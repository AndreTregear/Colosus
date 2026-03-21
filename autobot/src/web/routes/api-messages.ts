import { Router } from 'express';
import * as messagesRepo from '../../db/pg-messages-repo.js';

const router = Router();

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const jid = req.query.jid as string | undefined;
  
  if (jid) {
    const { messages, total } = await messagesRepo.getConversationMessages(DEFAULT_TENANT_ID, jid, limit, offset);
    res.json({ messages, total, limit, offset });
  } else {
    const { conversations, total } = await messagesRepo.getConversationList(DEFAULT_TENANT_ID, limit, offset);
    res.json({ conversations, total, limit, offset });
  }
});

export { router as messagesRouter };
