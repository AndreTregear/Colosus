import type { Router } from 'express';
import * as productsRepo from '../../../db/products-repo.js';
import { validateBody, getTenantId } from '../../../shared/validate.js';
import { createProductSchema, updateProductSchema } from '../../../shared/validation.js';
import { handleEntityResponse, handleDeleteResponse, handleCreatedResponse } from '../../shared/route-helpers.js';

export function mountProductRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    const tenantId = getTenantId(req);
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    
    if (search) {
      res.json(await productsRepo.searchProducts(tenantId, search));
    } else if (category) {
      res.json(await productsRepo.getProductsByCategory(tenantId, category));
    } else {
      const products = await productsRepo.getAllProducts(tenantId);
      res.json({ data: products, total: products.length });
    }
  });

  router.get(`${prefix}/categories`, async (req, res) => {
    res.json(await productsRepo.getCategories(getTenantId(req)));
  });

  router.get(`${prefix}/:id`, async (req, res) => {
    handleEntityResponse(res, await productsRepo.getProductById(getTenantId(req), Number(req.params.id)));
  });

  router.post(`${prefix}`, validateBody(createProductSchema), async (req, res) => {
    handleCreatedResponse(res, await productsRepo.createProduct(getTenantId(req), req.body));
  });

  router.put(`${prefix}/:id`, validateBody(updateProductSchema), async (req, res) => {
    handleEntityResponse(res, await productsRepo.updateProduct(getTenantId(req), Number(req.params.id), req.body));
  });

  router.delete(`${prefix}/:id`, async (req, res) => {
    handleDeleteResponse(res, await productsRepo.deleteProduct(getTenantId(req), Number(req.params.id)));
  });
}
