import { query, queryOne } from '../db/pool.js';
import { encryptRecord, decryptRecord } from '../crypto/middleware.js';

export interface BusinessContext {
  id: string;
  tenantId: string;
  businessName: string | null;
  businessDescription: string | null;
  businessType: string | null;
  operatingHours: Record<string, unknown>;
  servicesOffered: string[];
  productsCategories: string[];
  toneOfVoice: string;
  specialInstructions: string | null;
  adminConversationContext: string | null;
  adminConfigurationSummary: string | null;
  contextVersion: number;
  lastUpdatedBy: string | null;
  lastUpdatedAt: Date;
}

export interface AdminConversation {
  id: string;
  tenantId: string;
  sessionId: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  messageType: string;
  extractedConfig: Record<string, unknown>;
  timestamp: Date;
}

export interface TenantAdminSettings {
  tenantId: string;
  ownerJid: string | null;
  adminAgentEnabled: boolean;
  autoDetectOwner: boolean;
  welcomeMessageSent: boolean;
}

/**
 * Get business context for a tenant
 */
export async function getBusinessContext(tenantId: string): Promise<BusinessContext | null> {
  const row = await queryOne<{
    id: string;
    tenant_id: string;
    business_name: string | null;
    business_description: string | null;
    business_type: string | null;
    operating_hours: Record<string, unknown>;
    services_offered: string[];
    products_categories: string[];
    tone_of_voice: string;
    special_instructions: string | null;
    admin_conversation_context: string | null;
    admin_configuration_summary: string | null;
    context_version: number;
    last_updated_by: string | null;
    last_updated_at: Date;
  }>(
    `SELECT * FROM business_context WHERE tenant_id = $1`,
    [tenantId]
  );

  if (!row) return null;

  // Decrypt encrypted columns (business_description, special_instructions)
  const d = await decryptRecord(tenantId, 'business_context', row as unknown as Record<string, unknown>);

  return {
    id: d.id as string,
    tenantId: d.tenant_id as string,
    businessName: d.business_name as string | null,
    businessDescription: d.business_description as string | null,
    businessType: d.business_type as string | null,
    operatingHours: d.operating_hours as Record<string, unknown>,
    servicesOffered: (d.services_offered as string[]) || [],
    productsCategories: (d.products_categories as string[]) || [],
    toneOfVoice: d.tone_of_voice as string,
    specialInstructions: d.special_instructions as string | null,
    adminConversationContext: d.admin_conversation_context as string | null,
    adminConfigurationSummary: d.admin_configuration_summary as string | null,
    contextVersion: d.context_version as number,
    lastUpdatedBy: d.last_updated_by as string | null,
    lastUpdatedAt: d.last_updated_at as Date,
  };
}

/**
 * Update business context
 */
export async function updateBusinessContext(
  tenantId: string,
  updates: Partial<Omit<BusinessContext, 'id' | 'tenantId' | 'lastUpdatedAt'>>,
  updatedBy?: string
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Encrypt sensitive fields before building the SET clause
  const toEncrypt: Record<string, unknown> = {};
  if (updates.businessDescription !== undefined) toEncrypt.business_description = updates.businessDescription;
  if (updates.specialInstructions !== undefined) toEncrypt.special_instructions = updates.specialInstructions;
  const enc = Object.keys(toEncrypt).length > 0
    ? await encryptRecord(tenantId, 'business_context', toEncrypt)
    : toEncrypt;

  if (updates.businessName !== undefined) {
    fields.push(`business_name = $${paramIndex++}`);
    values.push(updates.businessName);
  }
  if (updates.businessDescription !== undefined) {
    fields.push(`business_description = $${paramIndex++}`);
    values.push(enc.business_description);
  }
  if (updates.businessType !== undefined) {
    fields.push(`business_type = $${paramIndex++}`);
    values.push(updates.businessType);
  }
  if (updates.operatingHours !== undefined) {
    fields.push(`operating_hours = $${paramIndex++}`);
    values.push(JSON.stringify(updates.operatingHours));
  }
  if (updates.servicesOffered !== undefined) {
    fields.push(`services_offered = $${paramIndex++}`);
    values.push(updates.servicesOffered);
  }
  if (updates.productsCategories !== undefined) {
    fields.push(`products_categories = $${paramIndex++}`);
    values.push(updates.productsCategories);
  }
  if (updates.toneOfVoice !== undefined) {
    fields.push(`tone_of_voice = $${paramIndex++}`);
    values.push(updates.toneOfVoice);
  }
  if (updates.specialInstructions !== undefined) {
    fields.push(`special_instructions = $${paramIndex++}`);
    values.push(enc.special_instructions);
  }
  if (updates.adminConversationContext !== undefined) {
    fields.push(`admin_conversation_context = $${paramIndex++}`);
    values.push(updates.adminConversationContext);
  }
  if (updates.adminConfigurationSummary !== undefined) {
    fields.push(`admin_configuration_summary = $${paramIndex++}`);
    values.push(updates.adminConfigurationSummary);
  }
  if (updates.contextVersion !== undefined) {
    fields.push(`context_version = $${paramIndex++}`);
    values.push(updates.contextVersion);
  }

  if (fields.length === 0) return;

  // Always update last_updated_at and optionally last_updated_by
  fields.push(`last_updated_at = NOW()`);
  if (updatedBy) {
    fields.push(`last_updated_by = $${paramIndex++}`);
    values.push(updatedBy);
  }

  // Increment context version
  fields.push(`context_version = context_version + 1`);

  values.push(tenantId);

  await query(
    `UPDATE business_context SET ${fields.join(', ')} WHERE tenant_id = $${paramIndex}`,
    values
  );
}

/**
 * Create or ensure business context exists
 */
export async function ensureBusinessContext(
  tenantId: string,
  businessName?: string
): Promise<void> {
  await query(
    `INSERT INTO business_context (tenant_id, business_name)
     VALUES ($1, $2)
     ON CONFLICT (tenant_id) DO NOTHING`,
    [tenantId, businessName || null]
  );
}

/**
 * Log admin conversation message
 */
export async function logAdminConversation(
  tenantId: string,
  sessionId: string,
  message: string,
  direction: 'incoming' | 'outgoing',
  messageType: string = 'chat',
  extractedConfig?: Record<string, unknown>
): Promise<void> {
  const encrypted = await encryptRecord(tenantId, 'admin_conversations', { message });
  await query(
    `INSERT INTO admin_conversations
     (tenant_id, session_id, message, direction, message_type, extracted_config)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tenantId, sessionId, encrypted.message, direction, messageType, JSON.stringify(extractedConfig || {})]
  );
}

/**
 * Get recent admin conversation history
 */
export async function getAdminConversationHistory(
  tenantId: string,
  sessionId: string,
  limit: number = 50
): Promise<AdminConversation[]> {
  const rows = await query<{
    id: string;
    tenant_id: string;
    session_id: string;
    message: string;
    direction: 'incoming' | 'outgoing';
    message_type: string;
    extracted_config: Record<string, unknown>;
    timestamp: Date;
  }>(
    `SELECT * FROM admin_conversations
     WHERE tenant_id = $1 AND session_id = $2
     ORDER BY timestamp DESC
     LIMIT $3`,
    [tenantId, sessionId, limit]
  );

  return Promise.all((rows.rows ?? []).map(async (row: any) => {
    const d = await decryptRecord(tenantId, 'admin_conversations', row as Record<string, unknown>);
    return {
      id: d.id as string,
      tenantId: d.tenant_id as string,
      sessionId: d.session_id as string,
      message: d.message as string,
      direction: d.direction as 'incoming' | 'outgoing',
      messageType: d.message_type as string,
      extractedConfig: d.extracted_config as Record<string, unknown>,
      timestamp: d.timestamp as Date,
    };
  }));
}

/**
 * Get admin settings for tenant
 */
export async function getAdminSettings(tenantId: string): Promise<TenantAdminSettings | null> {
  const row = await queryOne<{
    tenant_id: string;
    owner_jid: string | null;
    admin_agent_enabled: boolean;
    auto_detect_owner: boolean;
    welcome_message_sent: boolean;
  }>(
    `SELECT * FROM tenant_admin_settings WHERE tenant_id = $1`,
    [tenantId]
  );

  if (!row) return null;

  return {
    tenantId: row.tenant_id,
    ownerJid: row.owner_jid,
    adminAgentEnabled: row.admin_agent_enabled,
    autoDetectOwner: row.auto_detect_owner,
    welcomeMessageSent: row.welcome_message_sent,
  };
}

/**
 * Update admin settings
 */
export async function updateAdminSettings(
  tenantId: string,
  updates: Partial<TenantAdminSettings>
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.ownerJid !== undefined) {
    fields.push(`owner_jid = $${paramIndex++}`);
    values.push(updates.ownerJid);
  }
  if (updates.adminAgentEnabled !== undefined) {
    fields.push(`admin_agent_enabled = $${paramIndex++}`);
    values.push(updates.adminAgentEnabled);
  }
  if (updates.autoDetectOwner !== undefined) {
    fields.push(`auto_detect_owner = $${paramIndex++}`);
    values.push(updates.autoDetectOwner);
  }
  if (updates.welcomeMessageSent !== undefined) {
    fields.push(`welcome_message_sent = $${paramIndex++}`);
    values.push(updates.welcomeMessageSent);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = NOW()`);
  values.push(tenantId);

  await query(
    `UPDATE tenant_admin_settings SET ${fields.join(', ')} WHERE tenant_id = $${paramIndex}`,
    values
  );
}

/**
 * Check if a JID is the owner of the tenant
 */
export async function isOwner(tenantId: string, jid: string): Promise<boolean> {
  const settings = await getAdminSettings(tenantId);
  if (!settings?.ownerJid) return false;

  const normalizedOwner = settings.ownerJid.split('@')[0];
  const normalizedJid = jid.split('@')[0];

  return normalizedOwner === normalizedJid;
}

/**
 * Set owner JID for tenant
 */
export async function setOwnerJid(tenantId: string, ownerJid: string): Promise<void> {
  await query(
    `INSERT INTO tenant_admin_settings (tenant_id, owner_jid)
     VALUES ($1, $2)
     ON CONFLICT (tenant_id)
     DO UPDATE SET owner_jid = $2, updated_at = NOW()`,
    [tenantId, ownerJid]
  );
}
