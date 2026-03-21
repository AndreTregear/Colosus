import { BaseRepository } from './base-repository.js';
import { query } from './pool.js';
import type { Product, CreateProductInput, UpdateProductInput } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

const productSpec: Spec<Product> = {
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  description: 'description',
  price: { col: 'price', type: 'number' },
  category: 'category',
  productType: 'product_type',
  stock: 'stock',
  imageUrl: 'image_url',
  active: 'active',
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
};

const repo = new BaseRepository<Product>({
  table: 'products',
  spec: productSpec,
  tenantColumn: 'tenant_id',
});

export const getAllProducts = (tenantId: string) => repo.findAll(tenantId, { orderBy: 'category, name' });
export const getActiveProducts = (tenantId: string) =>
  repo.findManyByColumns({ active: true }, tenantId, { orderBy: 'category, name', orderDir: 'ASC' });
export const getProductById = (tenantId: string, id: number) => repo.findById(id, tenantId);
export const createProduct = (tenantId: string, input: CreateProductInput) =>
  repo.create({ ...input, tenantId, active: true } as Partial<Product>, tenantId);
export const deleteProduct = (tenantId: string, id: number) =>
  repo.update(id, { active: false } as Partial<Product>, tenantId).then(r => !!r);
export const getProductsCount = (tenantId: string) =>
  repo.count(tenantId, ['active = true']);

export async function searchProducts(tenantId: string, q: string): Promise<Product[]> {
  const pattern = `%${q}%`;
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM products WHERE tenant_id = $1 AND active = true
     AND (name ILIKE $2 OR description ILIKE $2 OR category ILIKE $2)
     ORDER BY category, name`,
    [tenantId, pattern],
  );
  return result.rows.map(r => repo.toEntity(r));
}

export async function getProductsByCategory(tenantId: string, category: string): Promise<Product[]> {
  return repo.findManyByColumns({ active: true, category }, tenantId, { orderBy: 'name', orderDir: 'ASC' });
}

export async function getCategories(tenantId: string): Promise<string[]> {
  const result = await query<{ category: string }>(
    'SELECT DISTINCT category FROM products WHERE tenant_id = $1 AND active = true ORDER BY category',
    [tenantId],
  );
  return result.rows.map(r => r.category);
}

export async function updateProduct(tenantId: string, id: number, input: UpdateProductInput): Promise<Product | undefined> {
  const existing = await getProductById(tenantId, id);
  if (!existing) return undefined;

  const data: Partial<Product> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = input.price;
  if (input.category !== undefined) data.category = input.category;
  if (input.productType !== undefined) data.productType = input.productType;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.active !== undefined) data.active = input.active;

  return repo.update(id, data, tenantId);
}

export async function getLowStockProducts(tenantId: string, threshold: number = 5): Promise<Product[]> {
  const result = await query<Record<string, unknown>>(
    'SELECT * FROM products WHERE tenant_id = $1 AND stock IS NOT NULL AND stock <= $2 ORDER BY stock ASC',
    [tenantId, threshold],
  );
  return result.rows.map(r => repo.toEntity(r));
}
