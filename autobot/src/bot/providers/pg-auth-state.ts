import { proto } from '@whiskeysockets/baileys';
import { query, queryOne } from '../../db/pool.js';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import { logger } from '../../shared/logger.js';

/**
 * Creates a Baileys auth state that persists to PostgreSQL.
 * Replaces useMultiFileAuthState — no filesystem dependency.
 */
export async function usePostgresAuthState(tenantId: string) {
  const writeData = async (data: unknown): Promise<string> => {
    return JSON.stringify(data, BufferJSON.replacer);
  };

  const readData = async (data: string): Promise<unknown> => {
    return JSON.parse(data, BufferJSON.reviver);
  };

  // Load or initialize creds
  const credsRow = await queryOne<any>(
    'SELECT creds FROM tenant_auth_creds WHERE tenant_id = $1',
    [tenantId],
  );

  let creds: any;
  if (credsRow?.creds) {
    const raw = typeof credsRow.creds === 'string' ? credsRow.creds : JSON.stringify(credsRow.creds);
    try {
      creds = JSON.parse(raw, BufferJSON.reviver);
    } catch {
      logger.warn({ tenantId }, 'Failed to parse auth creds, re-initializing');
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
    await query(
      `INSERT INTO tenant_auth_creds (tenant_id, creds) VALUES ($1, $2)
       ON CONFLICT(tenant_id) DO UPDATE SET creds = $2, updated_at = now()`,
      [tenantId, await writeData(creds)],
    );
  }

  const saveCreds = async () => {
    await query(
      `INSERT INTO tenant_auth_creds (tenant_id, creds) VALUES ($1, $2)
       ON CONFLICT(tenant_id) DO UPDATE SET creds = $2, updated_at = now()`,
      [tenantId, await writeData(creds)],
    );
  };

  const state = {
    creds,
    keys: {
      get: async (type: string, ids: string[]) => {
        const data: Record<string, any> = {};
        if (ids.length === 0) return data;

        // Build parameterized query for multiple IDs
        const placeholders = ids.map((_, i) => `$${i + 3}`).join(', ');
        const result = await query<any>(
          `SELECT key_id, key_data FROM tenant_auth_keys
           WHERE tenant_id = $1 AND key_type = $2 AND key_id IN (${placeholders})`,
          [tenantId, type, ...ids],
        );

        for (const row of result.rows) {
          const raw = typeof row.key_data === 'string' ? row.key_data : JSON.stringify(row.key_data);
          let value: unknown;
          try {
            value = JSON.parse(raw, BufferJSON.reviver);
          } catch {
            logger.warn({ tenantId, keyType: type, keyId: row.key_id }, 'Failed to parse auth key, skipping');
            continue;
          }
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          data[row.key_id] = value;
        }
        return data;
      },

      set: async (data: Record<string, Record<string, unknown>>) => {
        for (const [type, entries] of Object.entries(data)) {
          for (const [id, value] of Object.entries(entries)) {
            if (value) {
              const serialized = await writeData(value);
              await query(
                `INSERT INTO tenant_auth_keys (tenant_id, key_type, key_id, key_data)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT(tenant_id, key_type, key_id) DO UPDATE SET key_data = $4`,
                [tenantId, type, id, serialized],
              );
            } else {
              await query(
                'DELETE FROM tenant_auth_keys WHERE tenant_id = $1 AND key_type = $2 AND key_id = $3',
                [tenantId, type, id],
              );
            }
          }
        }
      },
    },
  };

  return { state, saveCreds };
}

/**
 * Clears all auth data for a tenant (for reset/re-pair).
 */
export async function clearAuthState(tenantId: string): Promise<void> {
  await query('DELETE FROM tenant_auth_creds WHERE tenant_id = $1', [tenantId]);
  await query('DELETE FROM tenant_auth_keys WHERE tenant_id = $1', [tenantId]);
}
