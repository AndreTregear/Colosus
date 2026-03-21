import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as productsRepo from '../../db/products-repo.js';
import * as settingsRepo from '../../db/settings-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const getInventoryStatusTool = createTool({
  id: 'get_inventory_status',
  description: 'Check current inventory levels and identify products with low stock. Use this proactively when discussing product availability or when the merchant asks about inventory.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const threshold = Number(await settingsRepo.getEffectiveSetting(tenantId, 'low_stock_threshold', '5'));
    const lowStock = await productsRepo.getLowStockProducts(tenantId, threshold);
    const allActive = await productsRepo.getActiveProducts(tenantId);

    const withStock = allActive.filter(p => p.stock !== null);
    const unlimited = allActive.filter(p => p.stock === null);

    return JSON.stringify({
      totalActive: allActive.length,
      trackedProducts: withStock.length,
      unlimitedStockProducts: unlimited.length,
      lowStockThreshold: threshold,
      lowStockItems: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.stock,
        active: p.active,
      })),
      summary: lowStock.length > 0
        ? `${lowStock.length} product(s) with low stock (≤${threshold} units)`
        : 'All products have healthy stock levels.',
    });
  },
});
