/**
 * Business Owner Intelligence Tools
 * Internal analytics and insights for business owners
 */

import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { AI_BASE_URL, AI_API_KEY, AI_MODEL } from '../config.js';

const provider = createOpenAICompatible({ name: 'yaya', baseURL: AI_BASE_URL, apiKey: AI_API_KEY });
const aiModel = provider.chatModel(AI_MODEL);
import * as productsRepo from '../db/products-repo.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import * as pgMessagesRepo from '../db/pg-messages-repo.js';
import { query, queryOne } from '../db/pool.js';
import { logger } from '../shared/logger.js';
import * as metabase from '../integrations/metabase-client.js';
import type { Product } from '../shared/types.js';

export interface BusinessInsights {
  // AI Usage
  aiUsage: {
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    byCapability: Record<string, { cost: number; requests: number }>;
    costTrend: 'increasing' | 'decreasing' | 'stable';
  };

  // Sales Performance
  sales: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    conversionRate: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };

  // Customer Insights
  customers: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    topQuestions: string[];
    commonIntents: Record<string, number>;
  };

  // Vision/Multimedia Usage
  multimedia: {
    imagesAnalyzed: number;
    productsFoundInImages: number;
    ocrUsage: number;
    stickerInteractions: number;
  };

  // Recommendations
  recommendations: string[];
}

export interface DailyReport {
  date: string;
  summary: string;
  metrics: {
    conversations: number;
    orders: number;
    revenue: number;
    aiCost: number;
  };
  highlights: string[];
  alerts: string[];
}

export class BusinessIntelligence {
  private static instance: BusinessIntelligence;

  private constructor() {}

  static getInstance(): BusinessIntelligence {
    if (!BusinessIntelligence.instance) {
      BusinessIntelligence.instance = new BusinessIntelligence();
    }
    return BusinessIntelligence.instance;
  }

  /**
   * Get comprehensive business insights
   */
  async getInsights(tenantId: string, days: number = 7): Promise<BusinessInsights> {
    const [
      aiUsage,
      sales,
      customers,
      multimedia,
    ] = await Promise.all([
      this.getAIUsageInsights(tenantId, days),
      this.getSalesInsights(tenantId, days),
      this.getCustomerInsights(tenantId, days),
      this.getMultimediaInsights(tenantId, days),
    ]);

    const recommendations = this.generateRecommendations({
      aiUsage,
      sales,
      customers,
      multimedia,
    });

    return {
      aiUsage,
      sales,
      customers,
      multimedia,
      recommendations,
    };
  }

  /**
   * Generate AI-powered daily report
   */
  async generateDailyReport(tenantId: string, date: Date): Promise<DailyReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get metrics for the day
    const [conversationCount, orderStats, aiStats] = await Promise.all([
      this.getConversationCount(tenantId, startOfDay, endOfDay),
      this.getOrderStats(tenantId, startOfDay, endOfDay),
      this.getAIStats(tenantId, startOfDay, endOfDay),
    ]);

    const metrics = {
      conversations: conversationCount,
      orders: orderStats.count,
      revenue: orderStats.revenue,
      aiCost: aiStats.cost,
    };

    // Generate highlights using AI
    const highlightsPrompt = `Genera un resumen ejecutivo para un negocio basado en estos datos del día:
- Conversaciones: ${metrics.conversations}
- Pedidos: ${metrics.orders}
- Ingresos: $${metrics.revenue.toFixed(2)}
- Costo de IA: $${metrics.aiCost.toFixed(4)}

Proporciona 3-5 highlights positivos y áreas de mejora. Responde en español, formato bullet points.`;

    const highlightsResponse = await generateText({
      model: aiModel,
      prompt: highlightsPrompt,
    });
    const highlightsText = highlightsResponse.text || '';

    const highlights = highlightsText
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•-]\s*/, '').trim())
      .filter(line => line.length > 0);

    // Generate alerts
    const alerts: string[] = [];
    if (metrics.aiCost > 5) {
      alerts.push('⚠️ Alto costo de IA: Considera optimizar el uso de imágenes');
    }
    if (metrics.orders === 0 && metrics.conversations > 10) {
      alerts.push('⚠️ Baja conversión: Hay conversaciones pero no pedidos. Revisa las respuestas del bot.');
    }

    return {
      date: date.toISOString().split('T')[0],
      summary: `Resumen del ${date.toLocaleDateString('es-ES')}: ${metrics.conversations} conversaciones, ${metrics.orders} pedidos, $${metrics.revenue.toFixed(2)} en ventas.`,
      metrics,
      highlights: highlights.length > 0 ? highlights : ['No hay highlights significativos hoy'],
      alerts,
    };
  }

  /**
   * Get AI usage insights
   */
  private async getAIUsageInsights(
    tenantId: string,
    days: number
  ): Promise<BusinessInsights['aiUsage']> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Query AI usage directly from DB
    const usageResult = await query<{
      total_cost: string;
      total_tokens: string;
      request_count: string;
    }>(
      `SELECT
        COALESCE(SUM(cost), 0)::text as total_cost,
        COALESCE(SUM(prompt_tokens + completion_tokens), 0)::text as total_tokens,
        COUNT(*)::text as request_count
       FROM ai_usage_events
       WHERE tenant_id = $1 AND timestamp >= $2`,
      [tenantId, startDate],
    );

    const row = usageResult.rows[0];

    return {
      totalCost: parseFloat(row?.total_cost || '0'),
      totalTokens: parseInt(row?.total_tokens || '0'),
      requestCount: parseInt(row?.request_count || '0'),
      byCapability: {},
      costTrend: 'stable' as const,
    };
  }

  /**
   * Get sales insights
   */
  private async getSalesInsights(
    tenantId: string,
    days: number
  ): Promise<BusinessInsights['sales']> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get orders in period
    const orders = await ordersRepo.getOrdersByDateRange(tenantId, startDate, new Date());
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Get top products
    const productSales = new Map<number, { quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productSales.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.unitPrice * item.quantity;
        } else {
          productSales.set(item.productId, {
            quantity: item.quantity,
            revenue: item.unitPrice * item.quantity,
          });
        }
      }
    }

    // Get product names
    const topProducts: Array<{ name: string; quantity: number; revenue: number }> = [];
    for (const [productId, sales] of productSales.entries()) {
      const product = await productsRepo.getProductById(tenantId, productId);
      if (product) {
        topProducts.push({
          name: product.name,
          quantity: sales.quantity,
          revenue: sales.revenue,
        });
      }
    }

    topProducts.sort((a, b) => b.revenue - a.revenue);

    return {
      totalOrders: orders.length,
      totalRevenue: totalRevenue,
      averageOrderValue,
      conversionRate: 0, // Would need conversation count
      topProducts: topProducts.slice(0, 5),
    };
  }

  /**
   * Get customer insights
   */
  private async getCustomerInsights(
    tenantId: string,
    days: number
  ): Promise<BusinessInsights['customers']> {
    const allCustomers = await customersRepo.getAllCustomers(tenantId, 10000);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get recent conversations
    const conversations = await query<{
      body: string;
      direction: string;
    }>(
      `SELECT body, direction 
       FROM message_log 
       WHERE tenant_id = $1 
         AND direction = 'incoming'
         AND timestamp >= $2
       ORDER BY timestamp DESC
       LIMIT 100`,
      [tenantId, startDate]
    );

    // Extract common questions (simple keyword extraction)
    const questionKeywords: Record<string, number> = {};
    for (const conv of conversations.rows) {
      const words = conv.body.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4 && !['hola', 'gracias', 'porque', 'cuando'].includes(word)) {
          questionKeywords[word] = (questionKeywords[word] || 0) + 1;
        }
      }
    }

    const topQuestions = Object.entries(questionKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Analyze intents
    const intents: Record<string, number> = {
      'product_inquiry': 0,
      'order_placement': 0,
      'support': 0,
      'greeting': 0,
    };

    for (const conv of conversations.rows) {
      const text = conv.body.toLowerCase();
      if (text.includes('precio') || text.includes('tienes') || text.includes('producto')) {
        intents['product_inquiry']++;
      } else if (text.includes('quiero') || text.includes('ordenar') || text.includes('pedido')) {
        intents['order_placement']++;
      } else if (text.includes('ayuda') || text.includes('problema')) {
        intents['support']++;
      } else if (text.includes('hola') || text.includes('buenos')) {
        intents['greeting']++;
      }
    }

    return {
      totalCustomers: allCustomers.length,
      activeCustomers: allCustomers.length, // Simplified - all customers considered active
      newCustomers: allCustomers.filter(c => {
        const created = c.createdAt ? new Date(c.createdAt) : null;
        return created && created >= startDate;
      }).length,
      topQuestions,
      commonIntents: intents,
    };
  }

  /**
   * Get multimedia/vision insights
   */
  private async getMultimediaInsights(
    tenantId: string,
    days: number
  ): Promise<BusinessInsights['multimedia']> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Query AI usage for vision-related capabilities
    const result = await query<{
      capability: string;
      count: string;
    }>(
      `SELECT capability, COUNT(*) as count
       FROM ai_usage_events
       WHERE tenant_id = $1
         AND timestamp >= $2
         AND capability IN ('vision', 'ocr', 'multimodal')
       GROUP BY capability`,
      [tenantId, startDate]
    );

    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      counts[row.capability] = parseInt(row.count);
    }

    return {
      imagesAnalyzed: (counts['vision'] || 0) + (counts['multimodal'] || 0),
      productsFoundInImages: 0, // Would need to track this separately
      ocrUsage: counts['ocr'] || 0,
      stickerInteractions: 0, // Would track sticker-specific usage
    };
  }

  /**
   * Generate recommendations based on insights
   */
  private generateRecommendations(insights: Partial<BusinessInsights>): string[] {
    const recommendations: string[] = [];

    if (insights.aiUsage) {
      if (insights.aiUsage.totalCost > 10) {
        recommendations.push('💡 Considera comprimir las imágenes antes de enviarlas al AI para reducir costos');
      }
      if (insights.aiUsage.byCapability['vision']?.cost > insights.aiUsage.totalCost * 0.5) {
        recommendations.push('💡 El 50% de tus costos de IA son de análisis de imágenes. Evalúa si todas las imágenes necesitan análisis completo.');
      }
    }

    if (insights.sales) {
      if (insights.sales.conversionRate < 0.1) {
        recommendations.push('🛒 Tu tasa de conversión es baja. Considera revisar las respuestas del bot o agregar un CTA más fuerte.');
      }
      if (insights.sales.averageOrderValue < 20) {
        recommendations.push('💰 Intenta sugerir productos complementarios para aumentar el valor promedio del pedido.');
      }
    }

    if (insights.customers) {
      if (insights.customers.commonIntents['support'] > 10) {
        recommendations.push('🎧 Hay muchas solicitudes de soporte. Considera agregar una FAQ o mejorar la documentación.');
      }
    }

    return recommendations;
  }

  /**
   * Helper: Get conversation count
   */
  private async getConversationCount(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT jid) as count
       FROM message_log
       WHERE tenant_id = $1
         AND timestamp >= $2
         AND timestamp <= $3`,
      [tenantId, startDate, endDate]
    );
    return parseInt(result?.count || '0');
  }

  /**
   * Helper: Get order stats
   */
  private async getOrderStats(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ count: number; revenue: number }> {
    const orders = await ordersRepo.getOrdersByDateRange(tenantId, startDate, endDate);
    return {
      count: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.total, 0),
    };
  }

  /**
   * Helper: Get AI stats
   */
  private async getAIStats(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ cost: number }> {
    const result = await query<{ total_cost: string }>(
      `SELECT COALESCE(SUM(cost), 0)::text as total_cost
       FROM ai_usage_events
       WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3`,
      [tenantId, startDate, endDate],
    );
    return { cost: parseFloat(result.rows[0]?.total_cost || '0') };
  }

  // ── Metabase-powered analytics (pre-built dashboards / saved questions) ──

  /**
   * Run a Metabase saved question by card ID, with optional tenant filter.
   * Returns raw rows or null if Metabase is unavailable.
   */
  async runSavedQuestion(
    cardId: number,
    tenantId?: string,
  ): Promise<{ columns: string[]; rows: unknown[][] } | null> {
    const available = await metabase.isServiceAvailable();
    if (!available) {
      logger.warn({ cardId }, 'Metabase unavailable, cannot run saved question');
      return null;
    }
    const params = tenantId ? { tenant_id: tenantId } : undefined;
    const result = await metabase.runSavedQuestion(cardId, params);
    if (!result) return null;
    return {
      columns: result.data.cols.map(c => c.display_name),
      rows: result.data.rows,
    };
  }

  /**
   * Get a full Metabase dashboard with all card results.
   */
  async getDashboardData(
    dashboardId: number,
    tenantId?: string,
  ): Promise<Map<number, { columns: string[]; rows: unknown[][] }>> {
    const available = await metabase.isServiceAvailable();
    if (!available) {
      logger.warn({ dashboardId }, 'Metabase unavailable, cannot load dashboard');
      return new Map();
    }
    const params = tenantId ? { tenant_id: tenantId } : undefined;
    const raw = await metabase.runDashboardQuestions(dashboardId, params);
    const result = new Map<number, { columns: string[]; rows: unknown[][] }>();
    for (const [cardId, qr] of raw) {
      result.set(cardId, {
        columns: qr.data.cols.map(c => c.display_name),
        rows: qr.data.rows,
      });
    }
    return result;
  }

  /**
   * List available Metabase dashboards.
   */
  async listDashboards(): Promise<Array<{ id: number; name: string; description?: string }>> {
    const available = await metabase.isServiceAvailable();
    if (!available) return [];
    return metabase.listDashboards();
  }
}

// Export singleton
export const businessIntelligence = BusinessIntelligence.getInstance();
