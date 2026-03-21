import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as productsRepo from '../../db/products-repo.js';
import { getAbsolutePath } from '../../shared/storage.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const sendProductImageTool = createTool({
  id: 'send_product_image',
  description: 'Send a product photo to the customer. Only works for products that have an image. Use this when the customer wants to see a product.',
  inputSchema: z.object({
    product_id: z.number().describe('Product ID to send the image for'),
    caption: z.string().optional().describe('Optional caption for the image'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const product = await productsRepo.getProductById(tenantId, input.product_id);
    if (!product) return 'Error: Product not found.';
    if (!product.imageUrl) return 'This product does not have a photo available.';

    // Return structured JSON that image-collector.ts will parse
    // The actual image sending is handled by the queue worker
    // Resolve relative path to absolute so Baileys can open the file
    const imagePath = getAbsolutePath(product.imageUrl);
    return JSON.stringify({
      productId: product.id,
      productName: product.name,
      imagePath,
      caption: input.caption || product.name,
      sendImage: true,
    });
  },
});
