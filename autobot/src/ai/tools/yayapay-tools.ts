// Mastra tools the WhatsApp agent uses to onboard people via yaya_pay.
//
// Typical onboarding flow:
//   1. New contact reaches the bot.
//   2. Agent calls `create-payment-link` with the customer's WhatsApp JID
//      as clientReferenceId, gets back a yape:// deep link + QR string.
//   3. Agent sends the link to the customer.
//   4. Customer pays. yaya_pay's phone matches the wallet notification and
//      POSTs a signed webhook to /api/v1/webhooks/yayapay.
//   5. Webhook handler (services/yayapay-service.ts) emits
//      `yayapay-payment-succeeded` and (for tenant:<id>:plan:<slug>) flips
//      the subscription to active.
//
// The agent can also poll `check-payment-status` while the customer pays,
// and `cancel-payment-link` if the customer changes their mind.

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as yayapay from '../../services/yayapay-service.js';
import * as yayapayRepo from '../../db/yayapay-repo.js';
import { logger } from '../../shared/logger.js';
import { getCurrentTenantOrNull } from '../tenant-context.js';

const WALLETS = [
  'YAPE', 'PLIN', 'NEQUI', 'DAVIPLATA',
  'MERCADOPAGO_MX', 'CODI_DIMO',
  'PIX_NUBANK', 'PIX_ITAU', 'PIX_BRADESCO', 'PIX_INTER',
  'MERCADOPAGO_AR', 'MERCADOPAGO_CL',
] as const;

export const createPaymentLink = createTool({
  id: 'create-payment-link',
  description:
    'Generate a payment link (deep link + QR) for a customer to pay via Yape, Plin, Nequi, PIX, MercadoPago, etc. Use during onboarding when a new contact needs to pay to activate access, or for any one-off charge. Returns paymentLink (e.g. yape://...) and qrData. The agent should send the paymentLink to the customer.',
  inputSchema: z.object({
    client_reference_id: z
      .string()
      .describe(
        'Domain id you will recognise on the webhook. For onboarding, use the customer WhatsApp JID. For tenant subscription activation, use "tenant:<uuid>" or "tenant:<uuid>:plan:<slug>".',
      ),
    amount: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Charge in the smallest unit (centimos for PEN/COP/MXN/BRL, whole pesos for CLP). Defaults to the configured onboarding price.'),
    wallet_type: z
      .enum(WALLETS)
      .optional()
      .describe('Wallet to charge (defaults to YAYAPAY_DEFAULT_WALLET — typically YAPE for Peru).'),
    description: z.string().max(200).optional().describe('Free-form description shown to the customer.'),
    customer_jid: z.string().optional().describe('Customer WhatsApp JID, stored locally for matching.'),
    purpose: z.enum(['onboarding', 'subscription', 'ad-hoc']).optional().describe('What this charge is for. Stored for analytics; does not affect behaviour.'),
    expiration_minutes: z.number().int().min(1).max(1440).optional().describe('How long the link stays valid. Defaults to 30.'),
  }),
  execute: async ({
    client_reference_id, amount, wallet_type, description, customer_jid, purpose, expiration_minutes,
  }) => {
    if (!yayapay.isConfigured()) {
      return {
        ok: false,
        error: 'yaya_pay not configured (missing YAYAPAY_BASE_URL / YAYAPAY_API_KEY).',
      };
    }
    const currentTenant = getCurrentTenantOrNull();

    // If the AI tries to use the `tenant:<uuid>` clientReferenceId convention
    // with a uuid that's NOT the current tenant, refuse — otherwise a
    // prompt-injected agent could mint a low-amount intent tagged for
    // someone else's subscription activation.
    const tenantRefMatch = client_reference_id.match(/^tenant:([0-9a-f-]{8,})/i);
    if (tenantRefMatch && currentTenant && tenantRefMatch[1] !== currentTenant) {
      logger.warn(
        { currentTenant, refTenant: tenantRefMatch[1], client_reference_id },
        'create-payment-link refused: clientReferenceId tenant mismatch',
      );
      return { ok: false, error: 'clientReferenceId tenant must match current tenant' };
    }

    try {
      const intent = await yayapay.createPayment({
        clientReferenceId: client_reference_id,
        amount,
        walletType: wallet_type,
        description,
        customerJid: customer_jid,
        purpose: purpose ?? 'onboarding',
        expirationMinutes: expiration_minutes,
        // Bind the intent to the current tenant in the local DB so the
        // webhook handler's tenant cross-check (services/yayapay-service.ts)
        // can verify activation requests.
        tenantId: currentTenant,
      });
      const minor = intent.amount;
      const major = intent.currency === 'CLP' ? minor : (minor / 100).toFixed(2);
      return {
        ok: true,
        intent_id: intent.id,
        payment_link: intent.paymentLink,
        qr_data: intent.qrData,
        amount_minor: minor,
        amount_display: `${intent.currency} ${major}`,
        wallet: intent.wallet,
        expires_at_ms: intent.expiresAt,
        message: intent.paymentLink
          ? `Listo. El cliente puede pagar abriendo: ${intent.paymentLink}`
          : 'Intent creado, pero el wallet no devolvió un deep link.',
      };
    } catch (err) {
      logger.error({ err, client_reference_id }, 'create-payment-link failed');
      return { ok: false, error: (err as Error).message };
    }
  },
});

export const checkPaymentStatus = createTool({
  id: 'check-payment-status',
  description:
    'Check the live status of a yaya_pay payment intent. Use when the customer says "ya pagué" but you have not received the webhook yet, or to confirm before delivering access.',
  inputSchema: z.object({
    intent_id: z.string().describe('The pi_... id from create-payment-link.'),
  }),
  execute: async ({ intent_id }) => {
    if (!yayapay.isConfigured()) {
      return { ok: false, error: 'yaya_pay not configured.' };
    }
    // Tenant cross-check: the intent must exist in our local DB and belong
    // to the current tenant. Without this, a prompt-injected agent (or a
    // customer chatting with another tenant's bot) could read or cancel any
    // tenant's payment intent given just the pi_... id.
    const currentTenant = getCurrentTenantOrNull();
    const localRow = await yayapayRepo.getIntent(intent_id);
    if (!localRow) return { ok: false, error: 'Intent no encontrado.' };
    if (currentTenant && localRow.tenant_id && localRow.tenant_id !== currentTenant) {
      logger.warn({ currentTenant, intentTenant: localRow.tenant_id, intent_id }, 'check-payment-status refused: tenant mismatch');
      return { ok: false, error: 'Intent no pertenece a este negocio.' };
    }
    try {
      const intent = await yayapay.retrievePayment(intent_id);
      return {
        ok: true,
        intent_id: intent.id,
        status: intent.status,
        sender_name: intent.senderName,
        succeeded_at_ms: intent.succeededAt,
        amount_minor: intent.amount,
        currency: intent.currency,
        wallet: intent.wallet,
      };
    } catch (err) {
      logger.error({ err, intent_id }, 'check-payment-status failed');
      return { ok: false, error: (err as Error).message };
    }
  },
});

export const cancelPaymentLink = createTool({
  id: 'cancel-payment-link',
  description:
    'Cancel an outstanding yaya_pay payment intent so it can no longer be paid. Use when the customer abandons or changes the order before paying.',
  inputSchema: z.object({
    intent_id: z.string().describe('The pi_... id to cancel.'),
  }),
  execute: async ({ intent_id }) => {
    if (!yayapay.isConfigured()) {
      return { ok: false, error: 'yaya_pay not configured.' };
    }
    const currentTenant = getCurrentTenantOrNull();
    const localRow = await yayapayRepo.getIntent(intent_id);
    if (!localRow) return { ok: false, error: 'Intent no encontrado.' };
    if (currentTenant && localRow.tenant_id && localRow.tenant_id !== currentTenant) {
      logger.warn({ currentTenant, intentTenant: localRow.tenant_id, intent_id }, 'cancel-payment-link refused: tenant mismatch');
      return { ok: false, error: 'Intent no pertenece a este negocio.' };
    }
    try {
      const intent = await yayapay.cancelPayment(intent_id);
      return { ok: true, intent_id: intent.id, status: intent.status };
    } catch (err) {
      logger.error({ err, intent_id }, 'cancel-payment-link failed');
      return { ok: false, error: (err as Error).message };
    }
  },
});

export const yayapayTools = { createPaymentLink, checkPaymentStatus, cancelPaymentLink };
