import crypto from 'node:crypto';
import { BaseRepository } from './base-repository.js';
import { query } from './pool.js';
import type { Tenant, CreateTenantInput, TenantSettings } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

const tenantSpec: Spec<Tenant> = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  phone: 'phone',
  apiKey: 'api_key',
  status: 'status',
  settings: { col: 'settings', type: 'json', default: {} },
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
};

const repo = new BaseRepository<Tenant>({
  table: 'tenants',
  spec: tenantSpec,
  primaryKey: 'id',
  softDeleteColumn: 'status',
});

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const apiKey = crypto.randomBytes(32).toString('hex');
  const tenant = await repo.create({
    name: input.name,
    slug: input.slug,
    apiKey,
    settings: input.settings ?? {},
    status: 'active',
  } as Partial<Tenant>);

  await query(
    `INSERT INTO settings (tenant_id, key, value) VALUES ($1, 'system_prompt', ''), ($1, 'ai_enabled', '1')`,
    [tenant.id],
  );
  await query(`INSERT INTO tenant_sessions (tenant_id) VALUES ($1)`, [tenant.id]);

  return tenant;
}

export const getTenantById = (id: string) => repo.findById(id);
export const getTenantBySlug = (slug: string) => repo.findByColumn('slug', slug);
export const getTenantByApiKey = (apiKey: string) => repo.findByColumn('api_key', apiKey);
export const getAllTenants = () => repo.findAll();
export const getActiveTenants = () => repo.findAll(undefined, { orderBy: 'created_at' });
export const deleteTenant = (id: string) => repo.delete(id);

export async function updateTenant(id: string, updates: { name?: string; settings?: TenantSettings; phone?: string }): Promise<Tenant | undefined> {
  const existing = await getTenantById(id);
  if (!existing) return undefined;

  const data: Partial<Tenant> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.phone !== undefined) data.phone = updates.phone;
  if (updates.settings) data.settings = { ...existing.settings, ...updates.settings };

  return repo.update(id, data);
}

export async function rotateApiKey(id: string): Promise<Tenant | undefined> {
  const newKey = crypto.randomBytes(32).toString('hex');
  return repo.update(id, { apiKey: newKey } as Partial<Tenant>);
}
