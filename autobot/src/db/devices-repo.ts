import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { Device } from '../shared/types.js';
import type { DeviceRow } from './row-types.js';

const rowToDevice = createRowMapper<Device>({
  id: 'id',
  tenantId: 'tenant_id',
  deviceId: 'device_id',
  businessName: 'business_name',
  phoneNumber: 'phone_number',
  token: 'token',
  lastSeenAt: { col: 'last_seen_at', type: 'date' },
  createdAt: { col: 'created_at', type: 'date' },
});

export async function createDevice(
  tenantId: string,
  deviceId: string,
  businessName: string,
  phoneNumber: string,
  token: string,
): Promise<Device> {
  const row = await queryOne<DeviceRow>(
    `INSERT INTO devices (tenant_id, device_id, business_name, phone_number, token)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (device_id) DO UPDATE SET
       tenant_id = $1, business_name = $3, phone_number = $4, token = $5
     RETURNING *`,
    [tenantId, deviceId, businessName, phoneNumber, token],
  );
  return rowToDevice(row!);
}

export async function getDeviceByToken(token: string): Promise<Device | undefined> {
  const row = await queryOne<DeviceRow>('SELECT * FROM devices WHERE token = $1', [token]);
  return row ? rowToDevice(row) : undefined;
}

export async function getDeviceByDeviceId(deviceId: string): Promise<Device | undefined> {
  const row = await queryOne<DeviceRow>('SELECT * FROM devices WHERE device_id = $1', [deviceId]);
  return row ? rowToDevice(row) : undefined;
}

export async function getDevicesByTenant(tenantId: string): Promise<Device[]> {
  const result = await query<DeviceRow>(
    'SELECT * FROM devices WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId],
  );
  return result.rows.map(rowToDevice);
}

export async function updateLastSeen(id: number): Promise<void> {
  await query('UPDATE devices SET last_seen_at = now() WHERE id = $1', [id]);
}
