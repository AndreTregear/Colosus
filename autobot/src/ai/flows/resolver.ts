import * as settingsRepo from '../../db/settings-repo.js';
import type { BusinessType, BusinessFlowConfig } from './types.js';
import { FLOW_CONFIGS } from './configs.js';

const VALID_TYPES: BusinessType[] = ['retail', 'service', 'delivery', 'lead_capture'];

/**
 * Resolve the business type for a tenant from their settings.
 * Defaults to 'retail' if not configured or invalid.
 */
export async function getBusinessType(tenantId: string): Promise<BusinessType> {
  const setting = await settingsRepo.getEffectiveSetting(tenantId, 'business_type', 'retail');
  return VALID_TYPES.includes(setting as BusinessType) ? (setting as BusinessType) : 'retail';
}

/**
 * Get the full flow configuration for a tenant's business type.
 */
export async function getFlowConfig(tenantId: string): Promise<BusinessFlowConfig> {
  const type = await getBusinessType(tenantId);
  return FLOW_CONFIGS[type];
}
