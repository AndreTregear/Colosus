import { tenantManager } from '../bot/tenant-manager.js';
import { appBus } from '../shared/events.js';
import { getMessage } from '../shared/message-templates.js';
import * as settingsRepo from '../db/settings-repo.js';
import * as tenantsRepo from '../db/tenants-repo.js';
import { logger } from '../shared/logger.js';

export async function sendWhatsAppMessage(tenantId: string, jid: string, message: string): Promise<void> {
  await tenantManager.sendMessage(tenantId, jid, message);
}

export async function notifyPaymentConfirmed(tenantId: string, orderId: number, customerJid: string): Promise<void> {
  try {
    const lang = await settingsRepo.getEffectiveSetting(tenantId, 'language', 'es');
    const message = getMessage('payment-confirmed', lang, { orderId });
    await tenantManager.sendMessage(tenantId, customerJid, message);
  } catch (err) {
    logger.error(err, `Failed to send Yape confirmation message for order #${orderId}`);
  }
}

export async function notifyLowStock(tenantId: string, _productId: number, productName: string, currentStock: number): Promise<void> {
  try {
    const lang = await settingsRepo.getEffectiveSetting(tenantId, 'language', 'es');
    const message = getMessage('low-stock-alert', lang, { productName, currentStock });
    const tenant = await tenantsRepo.getTenantById(tenantId);
    if (tenant?.phone) {
      await tenantManager.sendMessage(tenantId, tenant.phone, message);
    }
  } catch (err) {
    logger.error(err, `Failed to send low-stock alert for ${productName}`);
  }
}

export async function notifyOutOfStock(tenantId: string, _productId: number, productName: string): Promise<void> {
  try {
    const lang = await settingsRepo.getEffectiveSetting(tenantId, 'language', 'es');
    const message = getMessage('out-of-stock', lang, { productName });
    const tenant = await tenantsRepo.getTenantById(tenantId);
    if (tenant?.phone) {
      await tenantManager.sendMessage(tenantId, tenant.phone, message);
    }
  } catch (err) {
    logger.error(err, `Failed to send out-of-stock alert for ${productName}`);
  }
}

export function registerEventListeners(): void {
  appBus.on('yape-payment-matched', async (tenantId, _paymentId, orderId, customerJid) => {
    await notifyPaymentConfirmed(tenantId, orderId, customerJid);
  });
  logger.info('Yape matcher listener registered');

  appBus.on('low-stock-alert', async (tenantId, productId, productName, currentStock) => {
    await notifyLowStock(tenantId, productId, productName, currentStock);
  });

  appBus.on('out-of-stock', async (tenantId, productId, productName) => {
    await notifyOutOfStock(tenantId, productId, productName);
  });
  logger.info('Inventory alert listeners registered');
}
