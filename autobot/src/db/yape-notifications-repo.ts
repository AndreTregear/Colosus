import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { YapeNotification } from '../shared/types.js';
import type { YapeNotificationRow } from './row-types.js';
import { encryptRecord, decryptRecord, decryptRecords } from '../crypto/middleware.js';

const rowToNotification = createRowMapper<YapeNotification>({
  id: 'id',
  tenantId: 'tenant_id',
  deviceId: 'device_id',
  senderName: 'sender_name',
  amount: { col: 'amount', type: 'number' },
  capturedAt: { col: 'captured_at', type: 'date' },
  notificationHash: 'notification_hash',
  matchedPaymentId: { col: 'matched_payment_id', type: 'number?' },
  status: 'status',
  createdAt: { col: 'created_at', type: 'date' },
});

export async function createNotification(
  tenantId: string,
  deviceId: number,
  senderName: string,
  amount: number,
  capturedAt: Date,
  notificationHash: string,
): Promise<YapeNotification> {
  const encrypted = await encryptRecord(tenantId, 'yape_notifications', { sender_name: senderName });
  const row = await queryOne<YapeNotificationRow>(
    `INSERT INTO yape_notifications (tenant_id, device_id, sender_name, amount, captured_at, notification_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, deviceId, encrypted.sender_name, amount, capturedAt, notificationHash],
  );
  const decrypted = await decryptRecord(tenantId, 'yape_notifications', row as unknown as Record<string, unknown>);
  return rowToNotification(decrypted as YapeNotificationRow);
}

export async function getByHash(hash: string): Promise<YapeNotification | undefined> {
  const row = await queryOne<YapeNotificationRow>('SELECT * FROM yape_notifications WHERE notification_hash = $1', [hash]);
  if (!row) return undefined;
  const tenantId = (row as unknown as Record<string, unknown>).tenant_id as string;
  const decrypted = await decryptRecord(tenantId, 'yape_notifications', row as unknown as Record<string, unknown>);
  return rowToNotification(decrypted as YapeNotificationRow);
}

export async function markMatched(id: number, paymentId: number): Promise<void> {
  await query(
    "UPDATE yape_notifications SET status = 'matched', matched_payment_id = $1 WHERE id = $2",
    [paymentId, id],
  );
}

export async function markUnmatched(id: number): Promise<void> {
  await query("UPDATE yape_notifications SET status = 'unmatched' WHERE id = $1", [id]);
}

export async function getUnmatchedByTenant(tenantId: string): Promise<YapeNotification[]> {
  const result = await query<YapeNotificationRow>(
    "SELECT * FROM yape_notifications WHERE tenant_id = $1 AND status = 'unmatched' ORDER BY created_at DESC",
    [tenantId],
  );
  const decrypted = await decryptRecords(tenantId, 'yape_notifications', result.rows as unknown as Record<string, unknown>[]);
  return decrypted.map(r => rowToNotification(r as YapeNotificationRow));
}

export async function getRecentByTenant(tenantId: string, limit: number = 20): Promise<YapeNotification[]> {
  const result = await query<YapeNotificationRow>(
    'SELECT * FROM yape_notifications WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2',
    [tenantId, limit],
  );
  const decrypted = await decryptRecords(tenantId, 'yape_notifications', result.rows as unknown as Record<string, unknown>[]);
  return decrypted.map(r => rowToNotification(r as YapeNotificationRow));
}
