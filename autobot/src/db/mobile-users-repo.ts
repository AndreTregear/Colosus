import { queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { MobileUserRow } from './row-types.js';

export interface MobileUser {
  id: number;
  tenantId: string;
  phone: string;
  passwordHash: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

const rowToMobileUser = createRowMapper<MobileUser>({
  id: 'id',
  tenantId: 'tenant_id',
  phone: 'phone',
  passwordHash: 'password_hash',
  name: 'name',
  email: 'email',
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
});

export async function createMobileUser(
  phone: string,
  passwordHash: string,
  tenantId: string,
  name?: string,
  email?: string,
): Promise<MobileUser> {
  const row = await queryOne<MobileUserRow>(
    `INSERT INTO mobile_users (phone, password_hash, tenant_id, name, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [phone, passwordHash, tenantId, name ?? null, email ?? null],
  );
  return rowToMobileUser(row!);
}

export async function getMobileUserByPhone(phone: string): Promise<MobileUser | null> {
  const row = await queryOne<MobileUserRow>(
    'SELECT * FROM mobile_users WHERE phone = $1',
    [phone],
  );
  return row ? rowToMobileUser(row) : null;
}

export async function getMobileUserById(id: number): Promise<MobileUser | null> {
  const row = await queryOne<MobileUserRow>(
    'SELECT * FROM mobile_users WHERE id = $1',
    [id],
  );
  return row ? rowToMobileUser(row) : null;
}

export async function getMobileUserByTenantId(tenantId: string): Promise<MobileUser | null> {
  const row = await queryOne<MobileUserRow>(
    'SELECT * FROM mobile_users WHERE tenant_id = $1',
    [tenantId],
  );
  return row ? rowToMobileUser(row) : null;
}
