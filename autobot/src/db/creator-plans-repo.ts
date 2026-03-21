import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { CreatorPlan } from '../shared/types.js';
import type { CreatorPlanRow } from './row-types.js';

const rowToPlan = createRowMapper<CreatorPlan>({
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  description: 'description',
  price: { col: 'price', type: 'number' },
  billingCycle: 'billing_cycle',
  contentType: 'content_type',
  features: { col: 'features', type: 'json', default: {} },
  active: 'active',
  createdAt: { col: 'created_at', type: 'date' },
});

export async function getPlans(tenantId: string, activeOnly = true): Promise<CreatorPlan[]> {
  const where = activeOnly
    ? 'WHERE tenant_id = $1 AND active = true'
    : 'WHERE tenant_id = $1';
  const result = await query<CreatorPlanRow>(`SELECT * FROM creator_plans ${where} ORDER BY created_at DESC`, [tenantId]);
  return result.rows.map(rowToPlan);
}

export async function getPlanById(tenantId: string, planId: number): Promise<CreatorPlan | undefined> {
  const row = await queryOne<CreatorPlanRow>(
    'SELECT * FROM creator_plans WHERE tenant_id = $1 AND id = $2',
    [tenantId, planId],
  );
  return row ? rowToPlan(row) : undefined;
}

export interface CreateCreatorPlanInput {
  name: string;
  description?: string;
  price: number;
  billingCycle?: string;
  contentType?: string;
  features?: Record<string, unknown>;
}

export async function createPlan(tenantId: string, input: CreateCreatorPlanInput): Promise<CreatorPlan> {
  const row = await queryOne<CreatorPlanRow>(
    `INSERT INTO creator_plans (tenant_id, name, description, price, billing_cycle, content_type, features)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      tenantId,
      input.name,
      input.description ?? null,
      input.price,
      input.billingCycle ?? 'monthly',
      input.contentType ?? 'general',
      JSON.stringify(input.features ?? {}),
    ],
  );
  return rowToPlan(row!);
}

export async function updatePlan(
  tenantId: string,
  planId: number,
  updates: Partial<CreateCreatorPlanInput> & { active?: boolean },
): Promise<CreatorPlan | undefined> {
  const existing = await getPlanById(tenantId, planId);
  if (!existing) return undefined;

  const name = updates.name ?? existing.name;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const price = updates.price ?? existing.price;
  const billingCycle = updates.billingCycle ?? existing.billingCycle;
  const contentType = updates.contentType ?? existing.contentType;
  const features = updates.features ? { ...existing.features, ...updates.features } : existing.features;
  const active = updates.active ?? existing.active;

  const row = await queryOne<CreatorPlanRow>(
    `UPDATE creator_plans
     SET name = $1, description = $2, price = $3, billing_cycle = $4, content_type = $5, features = $6, active = $7
     WHERE tenant_id = $8 AND id = $9 RETURNING *`,
    [name, description, price, billingCycle, contentType, JSON.stringify(features), active, tenantId, planId],
  );
  return row ? rowToPlan(row) : undefined;
}

export async function deletePlan(tenantId: string, planId: number): Promise<boolean> {
  const result = await query(
    'UPDATE creator_plans SET active = false WHERE tenant_id = $1 AND id = $2',
    [tenantId, planId],
  );
  return (result.rowCount ?? 0) > 0;
}
