// High-level helpers around yaya_pay's HTTP API.
//
// The agent calls into here via Mastra tools to mint payment intents the
// customer can pay with Yape/Plin/Nequi/PIX/etc, and the webhook handler
// calls handleSucceededEvent() to activate access on payment.

import { randomUUID } from 'node:crypto';
import { YayaPay, YayaPayError } from '../integrations/yayapay/index.js';
import type {
  CreatePaymentIntentParams,
  PaymentIntent,
  WalletType,
  WebhookEvent,
} from '../integrations/yayapay/index.js';
import {
  YAYAPAY_API_KEY,
  YAYAPAY_BASE_URL,
  YAYAPAY_DEFAULT_WALLET,
  YAYAPAY_INTENT_TTL_MIN,
  YAYAPAY_ONBOARDING_AMOUNT,
  YAYAPAY_RECIPIENT_ID,
} from '../config.js';
import { logger } from '../shared/logger.js';
import { appBus } from '../shared/events.js';
import * as yayapayRepo from '../db/yayapay-repo.js';
import * as plansRepo from '../db/platform-plans-repo.js';
import * as tenantSubsRepo from '../db/tenant-subscriptions-repo.js';

let _client: YayaPay | null = null;

export function getYayaPayClient(): YayaPay {
  if (_client) return _client;
  if (!YAYAPAY_BASE_URL || !YAYAPAY_API_KEY) {
    throw new Error(
      'yaya_pay is not configured: set YAYAPAY_BASE_URL and YAYAPAY_API_KEY in the environment.',
    );
  }
  _client = new YayaPay({ baseUrl: YAYAPAY_BASE_URL, apiKey: YAYAPAY_API_KEY });
  return _client;
}

export function isConfigured(): boolean {
  return Boolean(YAYAPAY_BASE_URL && YAYAPAY_API_KEY);
}

// Reset the cached client — useful for tests and for hot-reloading config.
export function resetYayaPayClient(): void {
  _client = null;
}

export interface CreatePaymentArgs {
  // Pin the customer to the intent so the webhook can route activation.
  // For onboarding this is the customer JID; for tenant-attached charges
  // pass `tenant:<uuid>` (or any string you'll recognise on the way back).
  clientReferenceId: string;
  amount?: number;                       // smallest unit; defaults to YAYAPAY_ONBOARDING_AMOUNT
  walletType?: WalletType;
  description?: string;
  recipientId?: string;                  // Yape phone / handle to embed in link + QR
  expirationMinutes?: number;
  idempotencyKey?: string;               // pass through; auto-generated if omitted
  // Bookkeeping (stored locally, not sent to yaya_pay):
  tenantId?: string | null;
  customerJid?: string | null;
  purpose?: string;                      // "onboarding" | "subscription" | "ad-hoc"
  metadata?: Record<string, unknown>;
}

export async function createPayment(args: CreatePaymentArgs): Promise<PaymentIntent> {
  const yp = getYayaPayClient();
  const params: CreatePaymentIntentParams = {
    walletType: (args.walletType ?? YAYAPAY_DEFAULT_WALLET) as WalletType,
    amount: args.amount ?? YAYAPAY_ONBOARDING_AMOUNT,
    description: args.description,
    recipientId: args.recipientId ?? (YAYAPAY_RECIPIENT_ID || undefined),
    expirationMinutes: args.expirationMinutes ?? YAYAPAY_INTENT_TTL_MIN,
    idempotencyKey: args.idempotencyKey ?? randomUUID(),
    clientReferenceId: args.clientReferenceId,
  };

  const intent = await yp.paymentIntents.create(params);

  await yayapayRepo.upsertIntent({
    intent,
    tenantId: args.tenantId ?? null,
    customerJid: args.customerJid ?? null,
    purpose: args.purpose ?? null,
    metadata: args.metadata ?? null,
  });

  appBus.emit('yayapay-intent-created', intent.id, intent.clientReferenceId, intent.amount);
  logger.info(
    { intentId: intent.id, amount: intent.amount, wallet: intent.wallet, clientRef: intent.clientReferenceId, purpose: args.purpose },
    'yaya_pay intent created',
  );
  return intent;
}

export async function retrievePayment(intentId: string): Promise<PaymentIntent> {
  const intent = await getYayaPayClient().paymentIntents.retrieve(intentId);
  await yayapayRepo.upsertIntent({ intent });
  return intent;
}

export async function cancelPayment(intentId: string): Promise<PaymentIntent> {
  const intent = await getYayaPayClient().paymentIntents.cancel(intentId);
  await yayapayRepo.upsertIntent({ intent });
  return intent;
}

// Process a verified webhook event. Idempotent: a duplicate event id is a
// no-op. Always emits a bus event on first delivery so feature modules
// (onboarding skill, subscriptions, etc.) can react.
export async function handleEvent(event: WebhookEvent): Promise<{ processed: boolean }> {
  const isNew = await yayapayRepo.recordEventIfNew(event);
  if (!isNew) {
    logger.debug({ eventId: event.id, type: event.type }, 'yaya_pay duplicate webhook event — skipping');
    return { processed: false };
  }

  await yayapayRepo.upsertIntent({ intent: event.data });

  switch (event.type) {
    case 'payment_intent.succeeded': {
      appBus.emit(
        'yayapay-payment-succeeded',
        event.data.id,
        event.data.clientReferenceId,
        event.data.amount,
        event.data.senderName,
      );
      await tryActivateFromClientRef(event.data);
      break;
    }
    case 'payment_intent.expired': {
      appBus.emit('yayapay-payment-expired', event.data.id, event.data.clientReferenceId);
      break;
    }
    default:
      // created / canceled / failed — DB row is already updated above.
      break;
  }

  return { processed: true };
}

// Convention for clientReferenceId so onboarding "just works" out of the box:
//   "tenant:<uuid>"           → activate the tenant's subscription
//   "tenant:<uuid>:plan:<slug>" → switch the tenant to a specific plan
// Anything else is left to feature modules listening on the event bus.
//
// The activation is gated by THREE checks (each blocks if mismatched):
//   1. The local intent row's tenant_id (server-trusted, set when we minted
//      the intent) must match the tenant_id parsed from clientReferenceId.
//      Defends against an attacker who calls createPayment with a forged
//      clientReferenceId for someone else's tenant.
//   2. The succeeded amount must be >= the plan's price (in the same units).
//      Defends against paying 0.01 PEN to activate premium.
//   3. The plan slug must exist.
async function tryActivateFromClientRef(intent: PaymentIntent): Promise<void> {
  const ref = intent.clientReferenceId;
  if (!ref) return;

  const m = ref.match(/^tenant:([0-9a-f-]{8,})(?::plan:([a-z0-9_-]+))?$/i);
  if (!m) return;

  const refTenantId = m[1];
  const planSlug = m[2];

  try {
    // 1. Tenant cross-check: the row we stored locally when minting the
    // intent is the source of truth — clientReferenceId is just a hint.
    const localRow = await yayapayRepo.getIntent(intent.id);
    if (!localRow) {
      logger.warn({ intentId: intent.id, refTenantId }, 'yaya_pay activation: no local intent row — refusing to activate');
      return;
    }
    if (!localRow.tenant_id) {
      logger.warn({ intentId: intent.id, refTenantId }, 'yaya_pay activation: local intent has no tenant_id — refusing to activate');
      return;
    }
    if (localRow.tenant_id !== refTenantId) {
      logger.error(
        { intentId: intent.id, localTenantId: localRow.tenant_id, refTenantId },
        'yaya_pay activation: clientReferenceId tenant does not match minted tenant — possible spoof, refusing',
      );
      return;
    }

    const plan = planSlug ? await plansRepo.getPlanBySlug(planSlug) : null;
    if (planSlug && !plan) {
      logger.warn({ tenantId: refTenantId, planSlug }, 'yaya_pay activation: plan slug not found, ignoring');
      return;
    }

    // 2. Amount cross-check.
    if (plan) {
      const paid = Number(intent.amount);
      const required = Number(plan.price);
      if (!Number.isFinite(paid) || !Number.isFinite(required) || paid < required) {
        logger.error(
          { tenantId: refTenantId, planSlug, paid, required, intentId: intent.id },
          'yaya_pay activation: amount paid is below plan price — refusing to activate',
        );
        return;
      }
      await tenantSubsRepo.subscribe(refTenantId, plan.id, 'monthly');
      logger.info({ tenantId: refTenantId, planSlug, intentId: intent.id, paid, required }, 'yaya_pay activation: subscribed tenant to plan');
    } else {
      // No plan specified — just renew whatever is current. If there is
      // nothing current, this is a no-op the caller should handle.
      logger.info({ tenantId: refTenantId, intentId: intent.id }, 'yaya_pay payment received for tenant (no plan switch)');
    }
  } catch (err) {
    logger.error({ err, tenantId: refTenantId, planSlug, intentId: intent.id }, 'yaya_pay activation failed');
  }
}

export { YayaPayError };
