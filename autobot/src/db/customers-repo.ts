import { BaseRepository } from './base-repository.js';
import type { Customer, UpdateCustomerInput } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

const customerSpec: Spec<Customer> = {
  id: 'id',
  tenantId: 'tenant_id',
  channel: { col: 'channel', type: 'string', default: 'whatsapp' },
  jid: 'jid',
  name: 'name',
  phone: 'phone',
  location: 'location',
  locationLat: { col: 'location_lat', type: 'number?' },
  locationLng: { col: 'location_lng', type: 'number?' },
  address: 'address',
  notes: 'notes',
  tags: { col: 'tags', type: 'json', default: [] },
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
};

const repo = new BaseRepository<Customer>({
  table: 'customers',
  spec: customerSpec,
  tenantColumn: 'tenant_id',
});

export const getCustomerById = (tenantId: string, id: number) => repo.findById(id, tenantId);
export const getAllCustomers = (tenantId: string, limit = 100, offset = 0) =>
  repo.findAll(tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit, offset });
export const getCustomerCount = (tenantId: string) => repo.count(tenantId);
export async function getCustomersByTag(tenantId: string, tag: string): Promise<Customer[]> {
  const { query: dbQuery } = await import('./pool.js');
  const result = await dbQuery<Record<string, unknown>>(
    `SELECT * FROM customers WHERE tenant_id = $1 AND tags @> $2::jsonb ORDER BY updated_at DESC`,
    [tenantId, JSON.stringify([tag])],
  );
  return result.rows.map(r => repo.toEntity(r));
}

export async function getCustomerByJid(tenantId: string, jid: string, channel: string = 'whatsapp'): Promise<Customer | undefined> {
  return repo.findOneByColumns({ jid, channel }, tenantId);
}

export async function getOrCreateCustomer(tenantId: string, jid: string, channel: string = 'whatsapp'): Promise<Customer> {
  const existing = await getCustomerByJid(tenantId, jid, channel);
  if (existing) return existing;
  return repo.create({ tenantId, channel, jid } as Partial<Customer>, tenantId);
}

export async function updateCustomer(tenantId: string, id: number, input: UpdateCustomerInput): Promise<Customer | undefined> {
  const existing = await getCustomerById(tenantId, id);
  if (!existing) return undefined;

  const data: Partial<Customer> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.location !== undefined) data.location = input.location;
  if (input.locationLat !== undefined) data.locationLat = input.locationLat;
  if (input.locationLng !== undefined) data.locationLng = input.locationLng;
  if (input.address !== undefined) data.address = input.address;
  if (input.notes !== undefined) data.notes = input.notes;

  return repo.update(id, data, tenantId);
}

export async function updateCustomerLocation(
  tenantId: string,
  channel: string,
  jid: string,
  lat: number,
  lng: number,
  name?: string | null,
  address?: string | null,
): Promise<Customer> {
  const customer = await getOrCreateCustomer(tenantId, jid, channel);
  const locationText = [name, address].filter(Boolean).join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  return (await updateCustomer(tenantId, customer.id, {
    location: locationText,
    locationLat: lat,
    locationLng: lng,
    address: address || customer.address,
  }))!;
}

export async function addTag(tenantId: string, customerId: number, tag: string): Promise<Customer | undefined> {
  const customer = await getCustomerById(tenantId, customerId);
  if (!customer) return undefined;
  if (!customer.tags.includes(tag)) {
    return repo.update(customerId, { tags: [...customer.tags, tag] } as Partial<Customer>, tenantId);
  }
  return customer;
}

export async function removeTag(tenantId: string, customerId: number, tag: string): Promise<Customer | undefined> {
  const customer = await getCustomerById(tenantId, customerId);
  if (!customer) return undefined;
  return repo.update(customerId, { tags: customer.tags.filter(t => t !== tag) } as Partial<Customer>, tenantId);
}
