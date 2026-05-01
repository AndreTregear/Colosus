/**
 * Contador (Accountant) Portal API
 *
 * Contadores are the #1 distribution channel — each manages 30-50 MYPE clients.
 * Free portal with 20% revenue share on referred client subscriptions.
 *
 * POST /api/contador/register    — Create contador account
 * GET  /api/contador/dashboard   — KPI summary
 * GET  /api/contador/clients     — List referred clients
 * GET  /api/contador/commissions — Commission history
 * GET  /api/contador/referral    — Get referral code info
 * POST /api/contador/referral/regenerate — Generate new referral code
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { auth } from '../../auth/auth.js';
import { query } from '../../db/pool.js';
import { requireSession, requireContador } from '../middleware/session-auth.js';
import { logger } from '../../shared/logger.js';

const router = Router();

// ── Helper: generate a unique referral code ──
function generateReferralCode(): string {
  // Format: CTD-XXXXXX (8 chars after prefix, alphanumeric uppercase)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  let code = 'CTD-';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

// ── POST /register — Create a new contador account ──
router.post('/register', async (req, res) => {
  const { email, password, name, companyName, taxId, phone } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }

  // Input validation
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    res.status(400).json({ error: 'Password must be 8-128 characters' });
    return;
  }
  if (typeof name !== 'string' || name.length > 200) {
    res.status(400).json({ error: 'Name must be at most 200 characters' });
    return;
  }
  if (companyName && (typeof companyName !== 'string' || companyName.length > 200)) {
    res.status(400).json({ error: 'Company name must be at most 200 characters' });
    return;
  }
  if (taxId && (typeof taxId !== 'string' || taxId.length > 20)) {
    res.status(400).json({ error: 'Tax ID must be at most 20 characters' });
    return;
  }
  if (phone && (typeof phone !== 'string' || phone.length > 20)) {
    res.status(400).json({ error: 'Phone must be at most 20 characters' });
    return;
  }

  try {
    // Check if email already exists
    const { rows: existing } = await query<{ id: string }>(
      'SELECT id FROM "user" WHERE email = $1',
      [email],
    );
    if (existing.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Create Better Auth user with role=contador
    const ctx = await auth.api.signUpEmail({
      body: { email, password, name, tenantId: '' },
    });
    const userId = (ctx as { user: { id: string } }).user.id;
    await query('UPDATE "user" SET role = $1 WHERE id = $2', ['contador', userId]);

    // Generate unique referral code
    let referralCode: string;
    let attempts = 0;
    do {
      referralCode = generateReferralCode();
      const { rows } = await query('SELECT 1 FROM contadores WHERE referral_code = $1', [referralCode]);
      if (rows.length === 0) break;
      attempts++;
    } while (attempts < 10);

    // Create contador profile
    await query(
      `INSERT INTO contadores (user_id, referral_code, company_name, tax_id, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, referralCode, companyName || null, taxId || null, phone || null],
    );

    logger.info({ email, userId, referralCode }, 'New contador registered');

    res.status(201).json({
      ok: true,
      message: 'Contador account created. You can now sign in.',
      referralCode,
    });
  } catch (err) {
    logger.error({ err, email }, 'Contador registration failed');
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── All routes below require authenticated contador ──
router.use(requireSession);
router.use(requireContador);

// ── GET /dashboard — KPI summary for the contador ──
router.get('/dashboard', async (req, res) => {
  const userId = req.sessionUser!.id;

  try {
    // Get contador profile
    const { rows: contadorRows } = await query<{
      id: number; referral_code: string; commission_rate: string;
      total_clients: number; total_commission_earned: string;
      company_name: string | null; status: string;
    }>(
      'SELECT id, referral_code, commission_rate, total_clients, total_commission_earned, company_name, status FROM contadores WHERE user_id = $1',
      [userId],
    );
    if (contadorRows.length === 0) {
      res.status(404).json({ error: 'Contador profile not found' });
      return;
    }
    const contador = contadorRows[0];

    // Active clients count
    const { rows: clientCount } = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM contador_referrals WHERE contador_id = $1 AND status = $2',
      [contador.id, 'active'],
    );

    // This month's referred clients' revenue (sum of confirmed payments)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { rows: revenueRows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(p.amount), 0) as total
       FROM payments p
       JOIN contador_referrals cr ON cr.tenant_id = p.tenant_id
       WHERE cr.contador_id = $1 AND cr.status = 'active'
         AND p.status = 'confirmed'
         AND p.created_at >= $2`,
      [contador.id, monthStart.toISOString()],
    );

    // Pending commissions
    const { rows: pendingRows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(commission_amount), 0) as total
       FROM contador_commissions
       WHERE contador_id = $1 AND status = 'pending'`,
      [contador.id],
    );

    // Total paid commissions
    const { rows: paidRows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(commission_amount), 0) as total
       FROM contador_commissions
       WHERE contador_id = $1 AND status = 'paid'`,
      [contador.id],
    );

    res.json({
      contador: {
        id: contador.id,
        referralCode: contador.referral_code,
        commissionRate: parseFloat(contador.commission_rate),
        companyName: contador.company_name,
        status: contador.status,
      },
      kpis: {
        totalClients: parseInt(clientCount[0]?.count || '0'),
        clientRevenue: parseFloat(revenueRows[0]?.total || '0'),
        pendingCommissions: parseFloat(pendingRows[0]?.total || '0'),
        paidCommissions: parseFloat(paidRows[0]?.total || '0'),
        totalEarned: parseFloat(contador.total_commission_earned),
      },
    });
  } catch (err) {
    logger.error({ err, userId }, 'Contador dashboard failed');
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ── GET /clients — List referred clients with revenue summary ──
router.get('/clients', async (req, res) => {
  const userId = req.sessionUser!.id;

  try {
    const { rows: contadorRows } = await query<{ id: number }>(
      'SELECT id FROM contadores WHERE user_id = $1',
      [userId],
    );
    if (contadorRows.length === 0) {
      res.status(404).json({ error: 'Contador profile not found' });
      return;
    }
    const contadorId = contadorRows[0].id;

    const { rows: clients } = await query<{
      tenant_id: string; tenant_name: string; tenant_slug: string;
      referred_at: string; status: string;
      total_revenue: string; total_orders: string;
    }>(
      `SELECT
         cr.tenant_id,
         t.name as tenant_name,
         t.slug as tenant_slug,
         cr.referred_at,
         cr.status,
         COALESCE(stats.total_revenue, 0) as total_revenue,
         COALESCE(stats.total_orders, 0) as total_orders
       FROM contador_referrals cr
       JOIN tenants t ON t.id = cr.tenant_id
       LEFT JOIN LATERAL (
         SELECT
           SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END) as total_revenue,
           COUNT(DISTINCT o.id) as total_orders
         FROM orders o
         LEFT JOIN payments p ON p.order_id = o.id AND p.tenant_id = o.tenant_id
         WHERE o.tenant_id = cr.tenant_id
       ) stats ON true
       WHERE cr.contador_id = $1
       ORDER BY cr.referred_at DESC`,
      [contadorId],
    );

    res.json({
      clients: clients.map(c => ({
        tenantId: c.tenant_id,
        name: c.tenant_name,
        slug: c.tenant_slug,
        referredAt: c.referred_at,
        status: c.status,
        totalRevenue: parseFloat(c.total_revenue),
        totalOrders: parseInt(c.total_orders),
      })),
    });
  } catch (err) {
    logger.error({ err, userId }, 'Contador clients list failed');
    res.status(500).json({ error: 'Failed to load clients' });
  }
});

// ── GET /commissions — Commission history ──
router.get('/commissions', async (req, res) => {
  const userId = req.sessionUser!.id;

  try {
    const { rows: contadorRows } = await query<{ id: number }>(
      'SELECT id FROM contadores WHERE user_id = $1',
      [userId],
    );
    if (contadorRows.length === 0) {
      res.status(404).json({ error: 'Contador profile not found' });
      return;
    }
    const contadorId = contadorRows[0].id;

    const { rows: commissions } = await query<{
      id: number; tenant_id: string; tenant_name: string;
      source_type: string; gross_amount: string;
      commission_rate: string; commission_amount: string;
      status: string; period_month: string; paid_at: string | null;
      created_at: string;
    }>(
      `SELECT
         cc.id, cc.tenant_id, t.name as tenant_name,
         cc.source_type, cc.gross_amount,
         cc.commission_rate, cc.commission_amount,
         cc.status, cc.period_month, cc.paid_at, cc.created_at
       FROM contador_commissions cc
       JOIN tenants t ON t.id = cc.tenant_id
       WHERE cc.contador_id = $1
       ORDER BY cc.created_at DESC
       LIMIT 100`,
      [contadorId],
    );

    // Monthly summary
    const { rows: monthlySummary } = await query<{
      month: string; total: string; count: string;
    }>(
      `SELECT period_month as month,
              SUM(commission_amount) as total,
              COUNT(*) as count
       FROM contador_commissions
       WHERE contador_id = $1 AND status IN ('pending', 'approved', 'paid')
       GROUP BY period_month
       ORDER BY period_month DESC
       LIMIT 12`,
      [contadorId],
    );

    res.json({
      commissions: commissions.map(c => ({
        id: c.id,
        tenantId: c.tenant_id,
        clientName: c.tenant_name,
        sourceType: c.source_type,
        grossAmount: parseFloat(c.gross_amount),
        commissionRate: parseFloat(c.commission_rate),
        commissionAmount: parseFloat(c.commission_amount),
        status: c.status,
        periodMonth: c.period_month,
        paidAt: c.paid_at,
        createdAt: c.created_at,
      })),
      monthlySummary: monthlySummary.map(m => ({
        month: m.month,
        total: parseFloat(m.total),
        count: parseInt(m.count),
      })),
    });
  } catch (err) {
    logger.error({ err, userId }, 'Contador commissions list failed');
    res.status(500).json({ error: 'Failed to load commissions' });
  }
});

// ── GET /referral — Get referral code and stats ──
router.get('/referral', async (req, res) => {
  const userId = req.sessionUser!.id;

  try {
    const { rows } = await query<{
      referral_code: string; total_clients: number;
      commission_rate: string; company_name: string | null;
    }>(
      'SELECT referral_code, total_clients, commission_rate, company_name FROM contadores WHERE user_id = $1',
      [userId],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Contador profile not found' });
      return;
    }

    // Recent referrals
    const { rows: contadorRows } = await query<{ id: number }>(
      'SELECT id FROM contadores WHERE user_id = $1',
      [userId],
    );
    const { rows: recent } = await query<{
      tenant_name: string; referred_at: string;
    }>(
      `SELECT t.name as tenant_name, cr.referred_at
       FROM contador_referrals cr
       JOIN tenants t ON t.id = cr.tenant_id
       WHERE cr.contador_id = $1
       ORDER BY cr.referred_at DESC LIMIT 10`,
      [contadorRows[0].id],
    );

    res.json({
      referralCode: rows[0].referral_code,
      totalClients: rows[0].total_clients,
      commissionRate: parseFloat(rows[0].commission_rate),
      companyName: rows[0].company_name,
      recentReferrals: recent.map(r => ({
        clientName: r.tenant_name,
        referredAt: r.referred_at,
      })),
    });
  } catch (err) {
    logger.error({ err, userId }, 'Contador referral info failed');
    res.status(500).json({ error: 'Failed to load referral info' });
  }
});

// ── POST /referral/regenerate — Generate a new referral code ──
router.post('/referral/regenerate', async (req, res) => {
  const userId = req.sessionUser!.id;

  try {
    let referralCode: string;
    let attempts = 0;
    do {
      referralCode = generateReferralCode();
      const { rows } = await query('SELECT 1 FROM contadores WHERE referral_code = $1', [referralCode]);
      if (rows.length === 0) break;
      attempts++;
    } while (attempts < 10);

    await query(
      'UPDATE contadores SET referral_code = $1, updated_at = now() WHERE user_id = $2',
      [referralCode, userId],
    );

    logger.info({ userId, referralCode }, 'Contador regenerated referral code');
    res.json({ referralCode });
  } catch (err) {
    logger.error({ err, userId }, 'Referral code regeneration failed');
    res.status(500).json({ error: 'Failed to regenerate referral code' });
  }
});

// ── GET /clients/:tenantId/transactions — Detailed transaction view for a referred client ──
router.get('/clients/:tenantId/transactions', async (req, res) => {
  const userId = req.sessionUser!.id;
  const { tenantId } = req.params;

  try {
    // Verify this tenant belongs to the contador
    const { rows: contadorRows } = await query<{ id: number }>(
      'SELECT id FROM contadores WHERE user_id = $1',
      [userId],
    );
    if (contadorRows.length === 0) {
      res.status(404).json({ error: 'Contador profile not found' });
      return;
    }

    const { rows: refRows } = await query(
      'SELECT 1 FROM contador_referrals WHERE contador_id = $1 AND tenant_id = $2',
      [contadorRows[0].id, tenantId],
    );
    if (refRows.length === 0) {
      res.status(403).json({ error: 'This client is not in your referral network' });
      return;
    }

    // Get recent orders with payment status
    const { rows: transactions } = await query<{
      order_id: number; total: string; status: string;
      payment_status: string | null; payment_amount: string | null;
      customer_name: string | null; created_at: string;
    }>(
      `SELECT
         o.id as order_id, o.total, o.status,
         p.status as payment_status, p.amount as payment_amount,
         c.name as customer_name, o.created_at
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id AND p.tenant_id = o.tenant_id
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.tenant_id = $1
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [tenantId],
    );

    res.json({
      transactions: transactions.map(t => ({
        orderId: t.order_id,
        total: parseFloat(t.total),
        orderStatus: t.status,
        paymentStatus: t.payment_status,
        paymentAmount: t.payment_amount ? parseFloat(t.payment_amount) : null,
        customerName: t.customer_name,
        createdAt: t.created_at,
      })),
    });
  } catch (err) {
    logger.error({ err, userId, tenantId }, 'Contador client transactions failed');
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

export { router as contadorRouter };
