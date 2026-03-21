import { BaseRepository } from './base-repository.js';
import type { Lead, UpdateLeadInput } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

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

export const getLeadById = (tenantId: string, id: number) => repo.findById(id, tenantId);
export const getAllLeads = (tenantId: string, limit = 100, offset = 0) =>
  repo.findAll(tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit, offset });
export const getLeadCount = (tenantId: string) => repo.count(tenantId);

export async function getLeadByJid(tenantId: string, jid: string, _channel = 'whatsapp'): Promise<Lead | undefined> {
  return repo.findByColumn<'jid'>('jid', jid, tenantId);
}

export async function getOrCreateLead(tenantId: string, jid: string, channel = 'whatsapp'): Promise<Lead> {
  const existing = await getLeadByJid(tenantId, jid, channel);
  if (existing) return existing;
  return repo.create({ tenantId, channel, jid } as Partial<Lead>, tenantId);
}

export async function updateLead(tenantId: string, id: number, input: UpdateLeadInput): Promise<Lead | undefined> {
  const data: Partial<Lead> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) (data as any)[k] = v;
  }
  return repo.update(id, data, tenantId);
}

export async function getLeadsByStatus(tenantId: string, status: string, limit = 100, offset = 0): Promise<Lead[]> {
  return repo.findManyByColumns({ status }, tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit });
}

export async function getLeadsBySource(tenantId: string, source: string, limit = 100, offset = 0): Promise<Lead[]> {
  return repo.findManyByColumns({ source }, tenantId, { orderBy: 'updated_at', orderDir: 'DESC', limit });
}
