import { Router } from 'express';
import * as rulesRepo from '../../db/pg-rules-repo.js';
import type { CreateRuleInput } from '../../shared/types.js';

const router = Router();

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

router.get('/', async (_req, res) => {
  const rules = await rulesRepo.getAllRules(DEFAULT_TENANT_ID);
  res.json(rules);
});

router.get('/:id', async (req, res) => {
  const rule = await rulesRepo.getRuleById(DEFAULT_TENANT_ID, Number(req.params.id));
  if (!rule) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.json(rule);
});

router.post('/', async (req, res) => {
  const { name, pattern, matchType, reply, scope, scopeJid, enabled, priority } = req.body;

  if (!name || !pattern || !reply) {
    res.status(400).json({ error: 'name, pattern, and reply are required' });
    return;
  }

  // Validate regex patterns
  if (matchType === 'regex') {
    try {
      new RegExp(pattern);
    } catch {
      res.status(400).json({ error: 'Invalid regex pattern' });
      return;
    }
  }

  const input: CreateRuleInput = {
    name,
    pattern,
    matchType: matchType || 'contains',
    reply,
    scope: scope || 'all',
    scopeJid: scopeJid || null,
    enabled: enabled !== false,
    priority: priority ?? 100,
  };

  const rule = await rulesRepo.createRule(DEFAULT_TENANT_ID, input);
  res.status(201).json(rule);
});

router.put('/:id', async (req, res) => {
  // Validate regex if changing to regex type
  if (req.body.matchType === 'regex' && req.body.pattern) {
    try {
      new RegExp(req.body.pattern);
    } catch {
      res.status(400).json({ error: 'Invalid regex pattern' });
      return;
    }
  }

  const rule = await rulesRepo.updateRule(DEFAULT_TENANT_ID, Number(req.params.id), req.body);
  if (!rule) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.json(rule);
});

router.delete('/:id', async (req, res) => {
  const deleted = await rulesRepo.deleteRule(DEFAULT_TENANT_ID, Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.status(204).end();
});

export { router as rulesRouter };
