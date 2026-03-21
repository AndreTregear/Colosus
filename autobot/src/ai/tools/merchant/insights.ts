import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const businessHealthScoreTool = createTool({
  id: 'get_business_health_score',
  description: 'Compute a 0-100 health score for the business based on revenue trend, conversion, payments, and retention.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400_000).toISOString();

    const [revenueData, conversionData, pendingData, retentionData, aiData] = await Promise.all([
      // Revenue trend: current 30d vs previous 30d
      query<{ current: string; previous: string }>(
        `SELECT
           COALESCE(SUM(CASE WHEN created_at >= $2 THEN total END), 0) as current,
           COALESCE(SUM(CASE WHEN created_at < $2 AND created_at >= $3 THEN total END), 0) as previous
         FROM orders WHERE tenant_id = $1`,
        [tenantId, thirtyDaysAgo, sixtyDaysAgo],
      ),
      // Conversion: paid orders / total orders
      query<{ paid: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('paid', 'preparing', 'shipped', 'delivered')) as paid,
           COUNT(*) as total
         FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, thirtyDaysAgo],
      ),
      // Pending payments ratio
      query<{ pending: string; total: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'payment_requested') as pending,
           COUNT(*) as total
         FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, thirtyDaysAgo],
      ),
      // Customer retention: customers with 2+ orders
      query<{ returning: string; total: string }>(
        `SELECT
           COUNT(DISTINCT customer_id) FILTER (
             WHERE customer_id IN (
               SELECT customer_id FROM orders WHERE tenant_id = $1 GROUP BY customer_id HAVING COUNT(*) >= 2
             )
           ) as returning,
           COUNT(DISTINCT customer_id) as total
         FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, thirtyDaysAgo],
      ),
      // AI response rate (evaluations vs total messages)
      query<{ ai_count: string }>(
        `SELECT COUNT(*) as ai_count FROM agent_evaluations WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, thirtyDaysAgo],
      ),
    ]);

    // Revenue trend score (30%)
    const currRev = Number(revenueData.rows[0].current);
    const prevRev = Number(revenueData.rows[0].previous);
    const revTrend = prevRev > 0 ? Math.min(100, 50 + ((currRev - prevRev) / prevRev * 50)) : 50;
    const revScore = revTrend * 0.30;

    // Conversion rate score (25%)
    const totalOrders = Number(conversionData.rows[0].total);
    const convRate = totalOrders > 0 ? Number(conversionData.rows[0].paid) / totalOrders : 0;
    const convScore = Math.min(100, convRate * 100) * 0.25;

    // Pending payments score (20%) — lower pending ratio = higher score
    const pendingTotal = Number(pendingData.rows[0].total);
    const pendingRatio = pendingTotal > 0 ? Number(pendingData.rows[0].pending) / pendingTotal : 0;
    const pendingScore = (1 - pendingRatio) * 100 * 0.20;

    // Retention score (15%)
    const retTotal = Number(retentionData.rows[0].total);
    const retRate = retTotal > 0 ? Number(retentionData.rows[0].returning) / retTotal : 0;
    const retScore = Math.min(100, retRate * 100) * 0.15;

    // AI activity score (10%)
    const aiCount = Number(aiData.rows[0].ai_count);
    const aiScore = Math.min(100, aiCount / 10 * 100) * 0.10;

    const total = Math.round(revScore + convScore + pendingScore + retScore + aiScore);

    const recommendations: string[] = [];
    if (convRate < 0.5 && totalOrders > 5) recommendations.push('• Conversión baja — revisar catálogo y precios');
    if (pendingRatio > 0.3) recommendations.push('• Muchos pagos pendientes — usar send_payment_reminder');
    if (retRate < 0.2 && retTotal > 10) recommendations.push('• Poca retención — considerar descuentos para clientes recurrentes');
    if (currRev < prevRev * 0.8) recommendations.push('• Ingresos cayendo — revisar productos más vendidos');
    if (recommendations.length === 0) recommendations.push('• Negocio saludable ✅ Mantener ritmo actual');

    return `🏥 Business Health Score: ${total}/100\n\nRecomendaciones:\n${recommendations.join('\n')}`;
  },
});

export const identifyBestCustomersTool = createTool({
  id: 'identify_best_customers',
  description: 'Find the top 5 customers by spend, frequency, or recency.',
  inputSchema: z.object({
    criteria: z.enum(['spend', 'frequency', 'recent']).describe('Ranking criteria'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    let orderByExpr: string;
    let label: string;

    if (input.criteria === 'spend') {
      orderByExpr = 'SUM(o.total) DESC';
      label = 'mayor gasto';
    } else if (input.criteria === 'frequency') {
      orderByExpr = 'COUNT(o.id) DESC';
      label = 'mayor frecuencia';
    } else {
      orderByExpr = 'MAX(o.created_at) DESC';
      label = 'más recientes';
    }

    const result = await query<{
      customer_id: number;
      name: string;
      jid: string;
      order_count: string;
      total_spend: string;
      last_order: string;
    }>(
      `SELECT c.id as customer_id, c.name, c.jid,
              COUNT(o.id) as order_count,
              COALESCE(SUM(o.total), 0) as total_spend,
              MAX(o.created_at) as last_order
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
         AND o.status IN ('paid', 'preparing', 'shipped', 'delivered')
       WHERE c.tenant_id = $1
       GROUP BY c.id, c.name, c.jid
       HAVING COUNT(o.id) > 0
       ORDER BY ${orderByExpr}
       LIMIT 5`,
      [tenantId],
    );

    if (result.rows.length === 0) return 'No hay clientes con pedidos completados aún.';

    const lines = result.rows.map((r, i) => {
      const lastOrder = new Date(r.last_order).toLocaleDateString('es-PE');
      return `${i + 1}. ${r.name || 'Sin nombre'} — ${r.order_count} pedidos, ${Number(r.total_spend).toFixed(2)} total (último: ${lastOrder})`;
    });

    return `🌟 Top 5 clientes por ${label}:\n${lines.join('\n')}`;
  },
});
