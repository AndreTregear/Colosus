import { Router } from 'express';
import { startBot, stopBot, getBotState } from '../../bot/connection.js';
import { isAutoReplyEnabled, setAutoReplyEnabled } from '../../bot/handler.js';
import { getRulesCount } from '../../db/pg-rules-repo.js';
import type { BotStatus } from '../../shared/types.js';

const router = Router();

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

router.get('/', async (_req, res) => {
  const state = getBotState();
  const status: BotStatus = {
    running: state.running,
    connection: state.connectionState,
    autoReplyEnabled: isAutoReplyEnabled(),
    phoneNumber: state.phoneNumber,
    uptime: state.startedAt ? Math.floor((Date.now() - state.startedAt.getTime()) / 1000) : 0,
    rulesCount: await getRulesCount(DEFAULT_TENANT_ID),
    messagesHandled: state.messagesHandled,
  };
  res.json(status);
});

router.post('/start', async (_req, res) => {
  await startBot();
  res.json({ ok: true });
});

router.post('/stop', async (_req, res) => {
  await stopBot();
  res.json({ ok: true });
});

router.post('/toggle-autoreply', (req, res) => {
  const { enabled } = req.body;
  setAutoReplyEnabled(Boolean(enabled));
  res.json({ autoReplyEnabled: isAutoReplyEnabled() });
});

export { router as statusRouter };
