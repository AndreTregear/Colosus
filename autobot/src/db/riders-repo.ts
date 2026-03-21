import { BaseRepository } from './base-repository.js';
import { query, queryOne } from './pool.js';
import type { Rider } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

const riderSpec: Spec<Rider> = {
  id: 'id',
  tenantId: 'tenant_id',
  name: 'name',
  phone: 'phone',
  whatsappJid: 'whatsapp_jid',
  status: 'status',
  currentLat: { col: 'current_lat', type: 'number?' },
  currentLng: { col: 'current_lng', type: 'number?' },
  locationUpdatedAt: { col: 'location_updated_at', type: 'date' },
  createdAt: { col: 'created_at', type: 'date' },
};

const repo = new BaseRepository<Rider>({
  table: 'riders',
  spec: riderSpec,
  tenantColumn: 'tenant_id',
});

export const getAllRiders = (tenantId: string) => repo.findAll(tenantId, { orderBy: 'name' });
export const getRiderById = (tenantId: string, id: number) => repo.findById(id, tenantId);

export async function getAvailableRiders(tenantId: string): Promise<Rider[]> {
  const all = await repo.findAll(tenantId);
  return all.filter(r => r.status === 'available').sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateRiderStatus(tenantId: string, id: number, status: string): Promise<Rider | undefined> {
  return repo.update(id, { status } as Partial<Rider>, tenantId);
}

export async function updateRiderLocation(tenantId: string, riderId: number, lat: number, lng: number): Promise<Rider | undefined> {
  const row = await queryOne<Record<string, unknown>>(
    'UPDATE riders SET current_lat = $1, current_lng = $2, location_updated_at = now() WHERE tenant_id = $3 AND id = $4 RETURNING *',
    [lat, lng, tenantId, riderId],
  );
  return row ? repo.toEntity(row) : undefined;
}
