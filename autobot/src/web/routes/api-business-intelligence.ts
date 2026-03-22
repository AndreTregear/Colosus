/**
 * Business Intelligence Routes for Internal Use
 * Provides insights, analytics, and reports for business owners
 */

import { Router, type Request, type Response } from 'express';
import { requireSession } from '../middleware/session-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { businessIntelligence } from '../../ai/business-intelligence.js';
import { logger } from '../../shared/logger.js';

const router = Router();

// Apply session authentication
router.use(requireSession);

/**
 * GET /api/business/insights
 * Get comprehensive business insights
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);
    
    const insights = await businessIntelligence.getInsights(tenantId, days);
    
    res.json({
      success: true,
      period: { days, start: new Date(Date.now() - days * 24 * 60 * 60 * 1000), end: new Date() },
      data: insights,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get business insights');
    res.status(500).json({ error: 'Failed to load insights' });
  }
});

/**
 * GET /api/business/daily-report
 * Get AI-generated daily report
 */
router.get('/daily-report', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const dateParam = req.query.date as string;
    const date = dateParam ? new Date(dateParam) : new Date();
    
    const report = await businessIntelligence.generateDailyReport(tenantId, date);
    
    res.json({
      success: true,
      report,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to generate daily report');
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/business/ai-usage
 * Get AI usage breakdown (convenience endpoint)
 */
router.get('/ai-usage', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);
    
    const insights = await businessIntelligence.getInsights(tenantId, days);
    
    res.json({
      success: true,
      aiUsage: insights.aiUsage,
      multimedia: insights.multimedia,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get AI usage');
    res.status(500).json({ error: 'Failed to load AI usage' });
  }
});

/**
 * GET /api/business/customer-intents
 * Get breakdown of customer intents
 */
router.get('/customer-intents', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);
    
    const insights = await businessIntelligence.getInsights(tenantId, days);
    
    res.json({
      success: true,
      intents: insights.customers.commonIntents,
      topQuestions: insights.customers.topQuestions,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get customer intents');
    res.status(500).json({ error: 'Failed to load customer intents' });
  }
});

/**
 * POST /api/business/ask-ai
 * Ask the AI business assistant a question
 */
router.post('/ask-ai', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { question } = req.body;
    
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }
    
    // Get recent insights to provide context
    const insights = await businessIntelligence.getInsights(tenantId, 7);
    
    // Prepare context for AI
    const context = `
Datos del negocio (últimos 7 días):
- Ingresos: $${insights.sales.totalRevenue.toFixed(2)}
- Pedidos: ${insights.sales.totalOrders}
- Clientes: ${insights.customers.totalCustomers}
- Costo de IA: $${insights.aiUsage.totalCost.toFixed(4)}
- Producto más vendido: ${insights.sales.topProducts[0]?.name || 'N/A'}

Pregunta del dueño: ${question}
`;

    const { generateText } = await import('ai');
    const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible');
    const { AI_BASE_URL, AI_API_KEY, AI_MODEL } = await import('../../config.js');
    const provider = createOpenAICompatible({ name: 'yaya', baseURL: AI_BASE_URL, apiKey: AI_API_KEY });
    const aiModel = provider.chatModel(AI_MODEL);

    const result = await generateText({
      model: aiModel,
      prompt: context + '\n\nResponde como un asistente de negocios experto en español.',
    });

    res.json({
      success: true,
      question,
      answer: result.text || '',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to ask AI business assistant');
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export { router as businessIntelligenceRouter };
