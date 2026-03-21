import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { PlatformPlan } from '../shared/types.js';
import type { PlatformPlanRow } from './row-types.js';

const rowToPlan = createRowMapper<PlatformPlan>({
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  price: { col: 'price', type: 'number' },
  billingCycle: 'billing_cycle',
  features: { col: 'features', type: 'json', default: {} },
  limits: { col: 'limits', type: 'json', default: {} },
  sortOrder: 'sort_order',
  active: 'active',
  createdAt: { col: 'created_at', type: 'date' },
});

export async function getAllPlans(activeOnly = true): Promise<PlatformPlan[]> {
  const where = activeOnly ? 'WHERE active = true' : '';
  const result = await query<PlatformPlanRow>(`SELECT * FROM platform_plans ${where} ORDER BY sort_order, id`);
  return result.rows.map(rowToPlan);
}

export async function getPlanById(id: number): Promise<PlatformPlan | undefined> {
  const row = await queryOne<PlatformPlanRow>('SELECT * FROM platform_plans WHERE id = $1', [id]);
  return row ? rowToPlan(row) : undefined;
}

export async function getPlanBySlug(slug: string): Promise<PlatformPlan | undefined> {
  const row = await queryOne<PlatformPlanRow>('SELECT * FROM platform_plans WHERE slug = $1', [slug]);
  return row ? rowToPlan(row) : undefined;
}

export interface CreatePlanInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  billingCycle: string;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  sortOrder?: number;
}

export async function createPlan(input: CreatePlanInput): Promise<PlatformPlan> {
  const row = await queryOne<PlatformPlanRow>(
    `INSERT INTO platform_plans (name, slug, description, price, billing_cycle, features, limits, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.name,
      input.slug,
      input.description ?? null,
      input.price,
      input.billingCycle,
      JSON.stringify(input.features ?? {}),
      JSON.stringify(input.limits ?? {}),
      input.sortOrder ?? 0,
    ],
  );
  return rowToPlan(row!);
}

export async function updatePlan(
  id: number,
  updates: Partial<Omit<CreatePlanInput, 'slug'>> & { active?: boolean },
): Promise<PlatformPlan | undefined> {
  const existing = await getPlanById(id);
  if (!existing) return undefined;

  const name = updates.name ?? existing.name;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const price = updates.price ?? existing.price;
  const billingCycle = updates.billingCycle ?? existing.billingCycle;
  const features = updates.features ? { ...existing.features, ...updates.features } : existing.features;
  const limits = updates.limits ? { ...existing.limits, ...updates.limits } : existing.limits;
  const sortOrder = updates.sortOrder ?? existing.sortOrder;
  const active = updates.active ?? existing.active;

  const row = await queryOne<PlatformPlanRow>(
    `UPDATE platform_plans
     SET name = $1, description = $2, price = $3, billing_cycle = $4,
         features = $5, limits = $6, sort_order = $7, active = $8
     WHERE id = $9 RETURNING *`,
    [name, description, price, billingCycle, JSON.stringify(features), JSON.stringify(limits), sortOrder, active, id],
  );
  return row ? rowToPlan(row) : undefined;
}
