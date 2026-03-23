import { Router } from 'express';
import * as leadsRepo from '../../db/leads-repo.js';
import { decryptRecord, decryptRecords } from '../../crypto/middleware.js';

const router = Router();

// GET /api/leads — list all leads, filterable by ?status= or ?source=, paginated
router.get('/', async (req, res) => {
  const tenantId = (req as any).tenantId || (req as any).session?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

  const { status, source } = req.query;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  let leads;
  if (status) {
    leads = await leadsRepo.getLeadsByStatus(tenantId, status as string, limit, offset);
  } else if (source) {
    leads = await leadsRepo.getLeadsBySource(tenantId, source as string, limit, offset);
  } else {
    leads = await leadsRepo.getAllLeads(tenantId, limit, offset);
  }

  // Decrypt PII fields: name, email, phone, company, notes
  const decrypted = await decryptRecords(tenantId, 'leads', leads as unknown as Record<string, unknown>[]);
  const count = await leadsRepo.getLeadCount(tenantId);
  res.json({ leads: decrypted, total: count, limit, offset });
});

// GET /api/leads/count — lead count
router.get('/count', async (req, res) => {
  const tenantId = (req as any).tenantId || (req as any).session?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

  const count = await leadsRepo.getLeadCount(tenantId);
  res.json({ count });
});

// GET /api/leads/:id — single lead
router.get('/:id', async (req, res) => {
  const tenantId = (req as any).tenantId || (req as any).session?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

  const lead = await leadsRepo.getLeadById(tenantId, Number(req.params.id));
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  // Decrypt PII fields: name, email, phone, company, notes
  const decrypted = await decryptRecord(tenantId, 'leads', lead as unknown as Record<string, unknown>);
  res.json(decrypted);
});

export { router as leadsRouter };
