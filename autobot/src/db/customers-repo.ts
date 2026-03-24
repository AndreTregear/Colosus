import { BaseRepository } from './base-repository.js';
import type { Customer, UpdateCustomerInput } from '../shared/types.js';
import type { Spec } from './row-mapper.js';
import { encryptRecord, decryptRecord, decryptRecords } from '../crypto/middleware.js';

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

// Encryption helpers — encrypted field entity names match DB column names for this table
async function dec(tenantId: string, entity: Customer | undefined): Promise<Customer | undefined> {
  if (!entity) return undefined;
  return decryptRecord(tenantId, 'customers', entity as unknown as Record<string, unknown>) as unknown as Customer;
}
async function decAll(tenantId: string, entities: Customer[]): Promise<Customer[]> {
  return decryptRecords(tenantId, 'customers', entities as unknown as Record<string, unknown>[]) as unknown as Customer[];
}

export const getCustomerById = async (tenantId: string, id: number) =>
  dec(tenantId, await repo.findById(id, tenantId));
export const getAllCustomers = async (tenantId: string, limit = 100, offset = 0) =>
  decAll(tenantId, await repo.findAll(tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit, offset }));
export const getCustomerCount = (tenantId: string) => repo.count(tenantId);

export async function getCustomersByTag(tenantId: string, tag: string): Promise<Customer[]> {
  const { query: dbQuery } = await import('./pool.js');
  const result = await dbQuery<Record<string, unknown>>(
    `SELECT * FROM customers WHERE tenant_id = $1 AND tags @> $2::jsonb ORDER BY updated_at DESC`,
    [tenantId, JSON.stringify([tag])],
  );
  return decAll(tenantId, result.rows.map(r => repo.toEntity(r)));
}

export async function getCustomerByJid(tenantId: string, jid: string, channel: string = 'whatsapp'): Promise<Customer | undefined> {
  return dec(tenantId, await repo.findOneByColumns({ jid, channel }, tenantId));
}

export async function createCustomer(tenantId: string, input: {
  name: string;
  phone?: string | null;
  channel?: string;
  jid?: string;
  address?: string | null;
  notes?: string | null;
}): Promise<Customer> {
  const jid = input.jid || input.phone || `web-${Date.now()}`;
  const channel = input.channel || 'web';
  const encrypted = await encryptRecord(tenantId, 'customers', {
    name: input.name,
    phone: input.phone ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
  });
  const result = await repo.create({
    tenantId,
    channel,
    jid,
    name: encrypted.name,
    phone: encrypted.phone ?? null,
    address: encrypted.address ?? null,
    notes: encrypted.notes ?? null,
  } as Partial<Customer>, tenantId);
  return (await dec(tenantId, result))!;
}

export async function getOrCreateCustomer(tenantId: string, jid: string, channel: string = 'whatsapp'): Promise<Customer> {
  const existing = await getCustomerByJid(tenantId, jid, channel);
  if (existing) return existing;
  const result = await repo.create({ tenantId, channel, jid } as Partial<Customer>, tenantId);
  return (await dec(tenantId, result))!;
}

export async function updateCustomer(tenantId: string, id: number, input: UpdateCustomerInput): Promise<Customer | undefined> {
  const existing = await repo.findById(id, tenantId);
  if (!existing) return undefined;

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.location !== undefined) data.location = input.location;
  if (input.locationLat !== undefined) data.locationLat = input.locationLat;
  if (input.locationLng !== undefined) data.locationLng = input.locationLng;
  if (input.address !== undefined) data.address = input.address;
  if (input.notes !== undefined) data.notes = input.notes;

  const encrypted = await encryptRecord(tenantId, 'customers', data);
  const result = await repo.update(id, encrypted as Partial<Customer>, tenantId);
  return dec(tenantId, result);
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
    const result = await repo.update(customerId, { tags: [...customer.tags, tag] } as Partial<Customer>, tenantId);
    return dec(tenantId, result);
  }
  return customer;
}

export async function removeTag(tenantId: string, customerId: number, tag: string): Promise<Customer | undefined> {
  const customer = await getCustomerById(tenantId, customerId);
  if (!customer) return undefined;
  const result = await repo.update(customerId, { tags: customer.tags.filter(t => t !== tag) } as Partial<Customer>, tenantId);
  return dec(tenantId, result);
}
