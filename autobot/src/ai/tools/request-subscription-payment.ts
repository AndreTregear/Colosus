import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as customersRepo from '../../db/customers-repo.js';
import * as custSubsRepo from '../../db/customer-subscriptions-repo.js';
import * as creatorPlansRepo from '../../db/creator-plans-repo.js';
import * as subPaymentsRepo from '../../db/subscription-payments-repo.js';
import * as settingsRepo from '../../db/settings-repo.js';
import { BUSINESS_CURRENCY } from '../../config.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const requestSubscriptionPaymentTool = createTool({
  id: 'request_subscription_payment',
  description: 'Request a Yape payment for a customer subscription plan. Creates the subscription (or renewal) and generates a pending payment. Use after the customer has chosen a plan and confirmed they want to subscribe.',
  inputSchema: z.object({
    plan_id: z.number().describe('The creator plan ID the customer wants to subscribe to'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const customer = await customersRepo.getOrCreateCustomer(tenantId, jid, channel);

    const plan = await creatorPlansRepo.getPlanById(tenantId, input.plan_id);
    if (!plan) return 'Error: Subscription plan not found.';
    if (!plan.active) return 'Error: This subscription plan is no longer available.';

    const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);
    const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number');

    // Check if customer already has active subscription to this plan
    const activeSubs = await custSubsRepo.getActiveByCustomer(tenantId, customer.id);
    const existing = activeSubs.find(s => s.planId === input.plan_id);

    if (existing) {
      // Create renewal payment
      const periodStart = existing.currentPeriodEnd;
      const periodEnd = new Date(new Date(existing.currentPeriodEnd).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const subPayment = await subPaymentsRepo.createPayment({
        tenantId,
        subscriptionType: 'creator',
        subscriptionId: existing.id,
        amount: plan.price,
        periodStart,
        periodEnd,
      });

      return JSON.stringify({
        type: 'renewal',
        subscriptionPaymentId: subPayment.id,
        subscriptionId: existing.id,
        planName: plan.name,
        amount: plan.price,
        currency,
        yapeNumber,
      });
    }

    // Create new subscription + payment
    const subscription = await custSubsRepo.subscribe(
      tenantId, customer.id, input.plan_id, plan.billingCycle,
    );

    const subPayment = await subPaymentsRepo.createPayment({
      tenantId,
      subscriptionType: 'creator',
      subscriptionId: subscription.id,
      amount: plan.price,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    });

    return JSON.stringify({
      type: 'new',
      subscriptionPaymentId: subPayment.id,
      subscriptionId: subscription.id,
      planName: plan.name,
      amount: plan.price,
      currency,
      yapeNumber,
      billingCycle: plan.billingCycle,
    });
  },
});
