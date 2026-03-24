import { BaseRepository } from './base-repository.js';
import type { Lead, UpdateLeadInput } from '../shared/types.js';
import type { Spec } from './row-mapper.js';
import { encryptRecord, decryptRecord, decryptRecords } from '../crypto/middleware.js';

const leadSpec: Spec<Lead> = {
  id: 'id',
  tenantId: 'tenant_id',
  channel: { col: 'channel', type: 'string', default: 'whatsapp' },
  jid: 'jid',
  name: 'name',
  company: 'company',
  email: 'email',
  phone: 'phone',
  interest: 'interest',
  source: { col: 'source', type: 'string', default: 'whatsapp' },
  status: { col: 'status', type: 'string', default: 'new' },
  qualificationScore: { col: 'qualification_score', type: 'number?' },
  qualificationNotes: 'qualification_notes',
  notes: 'notes',
  tags: { col: 'tags', type: 'json', default: [] },
  metadata: { col: 'metadata', type: 'json', default: {} },
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
};

const repo = new BaseRepository<Lead>({
  table: 'leads',
  spec: leadSpec,
  tenantColumn: 'tenant_id',
});

// Encryption helpers — encrypted field entity names match DB column names for this table
async function dec(tenantId: string, entity: Lead | undefined): Promise<Lead | undefined> {
  if (!entity) return undefined;
  return decryptRecord(tenantId, 'leads', entity as unknown as Record<string, unknown>) as unknown as Lead;
}
async function decAll(tenantId: string, entities: Lead[]): Promise<Lead[]> {
  return decryptRecords(tenantId, 'leads', entities as unknown as Record<string, unknown>[]) as unknown as Lead[];
}

export const getLeadById = async (tenantId: string, id: number) =>
  dec(tenantId, await repo.findById(id, tenantId));
export const getAllLeads = async (tenantId: string, limit = 100, offset = 0) =>
  decAll(tenantId, await repo.findAll(tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit, offset }));
export const getLeadCount = (tenantId: string) => repo.count(tenantId);

export async function getLeadByJid(tenantId: string, jid: string, _channel = 'whatsapp'): Promise<Lead | undefined> {
  return dec(tenantId, await repo.findByColumn<'jid'>('jid', jid, tenantId));
}

export async function getOrCreateLead(tenantId: string, jid: string, channel = 'whatsapp'): Promise<Lead> {
  const existing = await getLeadByJid(tenantId, jid, channel);
  if (existing) return existing;
  const result = await repo.create({ tenantId, channel, jid } as Partial<Lead>, tenantId);
  return (await dec(tenantId, result))!;
}

export async function updateLead(tenantId: string, id: number, input: UpdateLeadInput): Promise<Lead | undefined> {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) data[k] = v;
  }
  const encrypted = await encryptRecord(tenantId, 'leads', data);
  const result = await repo.update(id, encrypted as Partial<Lead>, tenantId);
  return dec(tenantId, result);
}

export async function getLeadsByStatus(tenantId: string, status: string, limit = 100, offset = 0): Promise<Lead[]> {
  return decAll(tenantId, await repo.findManyByColumns({ status }, tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit }));
}

export async function getLeadsBySource(tenantId: string, source: string, limit = 100, offset = 0): Promise<Lead[]> {
  return decAll(tenantId, await repo.findManyByColumns({ source }, tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit }));
}
