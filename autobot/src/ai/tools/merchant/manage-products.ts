import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as productsRepo from '../../../db/products-repo.js';
import { BUSINESS_CURRENCY } from '../../../config.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const addProductTool = createTool({
  id: 'create_product',
  description: 'Create a new product in the catalog.',
  inputSchema: z.object({
    name: z.string().describe('Product name'),
    price: z.number().positive().describe('Price'),
    category: z.string().optional().describe('Category name'),
    description: z.string().optional().describe('Product description'),
    stock: z.number().int().nonnegative().optional().describe('Initial stock quantity'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const product = await productsRepo.createProduct(tenantId, {
      name: input.name,
      price: input.price,
      category: input.category ?? 'General',
      description: input.description ?? '',
      stock: input.stock ?? null,
      productType: 'physical',
      imageUrl: null,
      active: true,
    });
    return `✅ Producto creado: ${product.name} a ${input.price.toFixed(2)} ${BUSINESS_CURRENCY}. ID: #${product.id}`;
  },
});

export const updateProductTool = createTool({
  id: 'update_product',
  description: 'Update an existing product (name, price, stock, active status, description).',
  inputSchema: z.object({
    product_id: z.number().int().describe('Product ID to update'),
    name: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    active: z.boolean().optional().describe('Set false to hide product'),
    description: z.string().optional(),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const updates: Record<string, unknown> = {};
    const changes: string[] = [];
    if (input.name !== undefined) { updates.name = input.name; changes.push(`nombre→${input.name}`); }
    if (input.price !== undefined) { updates.price = input.price; changes.push(`precio→${input.price}`); }
    if (input.stock !== undefined) { updates.stock = input.stock; changes.push(`stock→${input.stock}`); }
    if (input.active !== undefined) { updates.active = input.active; changes.push(`activo→${input.active}`); }
    if (input.description !== undefined) { updates.description = input.description; changes.push('descripción actualizada'); }

    const updated = await productsRepo.updateProduct(tenantId, input.product_id, updates);
    if (!updated) return `❌ Producto #${input.product_id} no encontrado.`;
    return `✅ Producto #${input.product_id} actualizado: ${changes.join(', ')}`;
  },
});

export const setStockTool = createTool({
  id: 'set_product_stock',
  description: 'Quickly update the stock quantity of a product.',
  inputSchema: z.object({
    product_id: z.number().int().describe('Product ID'),
    stock: z.number().int().nonnegative().describe('New stock quantity'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const updated = await productsRepo.updateProduct(tenantId, input.product_id, { stock: input.stock });
    if (!updated) return `❌ Producto #${input.product_id} no encontrado.`;
    return `Stock de "${updated.name}" actualizado a ${input.stock} unidades.`;
  },
});
