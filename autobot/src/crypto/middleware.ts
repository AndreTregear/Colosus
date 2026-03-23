import { getCachedDEK } from './key-cache.js';
import { encryptField, decryptField, isEncrypted } from './field-crypto.js';

// Map of table → columns that should be encrypted
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  customers: ['name', 'phone', 'address', 'notes', 'location'],
  orders: ['notes', 'delivery_address'],
  payments: ['reference', 'confirmed_by'],
  yape_notifications: ['sender_name'],
  message_log: ['body', 'push_name'],
  business_context: ['business_description', 'special_instructions'],
  leads: ['name', 'email', 'phone', 'company', 'notes'],
  appointments: ['notes'],
  admin_conversations: ['message'],
  conversations: ['messages'],
};

/**
 * Get the list of encrypted columns for a table.
 */
export function getEncryptedColumns(table: string): string[] {
  return ENCRYPTED_FIELDS[table] || [];
}

/**
 * Encrypt sensitive fields in a record before writing to DB.
 * Returns a new object with encrypted values.
 */
export async function encryptRecord(
  tenantId: string,
  table: string,
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const dek = await getCachedDEK(tenantId);
  if (!dek) {
    // No DEK cached — tenant not authenticated or keys not provisioned
    return record;
  }

  const columns = getEncryptedColumns(table);
  if (columns.length === 0) return record;

  const encrypted = { ...record };
  for (const col of columns) {
    const val = encrypted[col];
    if (val != null && typeof val === 'string' && val.length > 0 && !isEncrypted(val)) {
      encrypted[col] = encryptField(val, dek, tenantId, table, col);
    }
  }
  return encrypted;
}

/**
 * Decrypt sensitive fields in a record after reading from DB.
 * Returns a new object with decrypted values.
 */
export async function decryptRecord(
  tenantId: string,
  table: string,
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const dek = await getCachedDEK(tenantId);
  if (!dek) return record;

  const columns = getEncryptedColumns(table);
  if (columns.length === 0) return record;

  const decrypted = { ...record };
  for (const col of columns) {
    const val = decrypted[col];
    if (val != null && typeof val === 'string' && isEncrypted(val)) {
      const plain = decryptField(val, dek, tenantId, table, col);
      if (plain !== null) {
        decrypted[col] = plain;
      }
    }
  }
  return decrypted;
}

/**
 * Decrypt an array of records (convenience for list endpoints).
 */
export async function decryptRecords(
  tenantId: string,
  table: string,
  records: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  return Promise.all(records.map(r => decryptRecord(tenantId, table, r)));
}
