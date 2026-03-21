import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as productsRepo from '../../db/products-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const searchProductsTool = createTool({
  id: 'search_products',
  description: 'Search the product catalog by text query or category name. Returns matching products with IDs, prices, and availability. Use this when a customer asks about products, prices, or availability.',
  inputSchema: z.object({
    query: z.string().optional().describe('Free-text search query (searches name, description, category)'),
    category: z.string().optional().describe('Filter by exact category name'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    let products;
    if (input.category) {
      products = await productsRepo.getProductsByCategory(tenantId, input.category);
    } else if (input.query) {
      products = await productsRepo.searchProducts(tenantId, input.query);
    } else {
      products = await productsRepo.getActiveProducts(tenantId);
    }

    if (products.length === 0) {
      return 'No products found matching your search.';
    }

    return products.map(p => {
      const stock = p.stock === null ? 'unlimited' : `${p.stock} left`;
      const foto = p.imageUrl ? ' [has photo]' : '';
      return `[ID:${p.id}] ${p.name} — ${p.price.toFixed(2)} (${p.category}, ${stock})${foto}`;
    }).join('\n');
  },
});
