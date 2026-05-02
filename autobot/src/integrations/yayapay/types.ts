// Wire types for yaya_pay's HTTP API. Mirrors the Kotlin DTOs in the
// upstream Android app and the @yayapay/sdk types.

export type WalletType =
  | 'YAPE'
  | 'PLIN'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'MERCADOPAGO_MX'
  | 'CODI_DIMO'
  | 'PIX_NUBANK'
  | 'PIX_ITAU'
  | 'PIX_BRADESCO'
  | 'PIX_INTER'
  | 'MERCADOPAGO_AR'
  | 'MERCADOPAGO_CL';

export type Currency = 'PEN' | 'COP' | 'MXN' | 'BRL' | 'ARS' | 'CLP';

export type PaymentIntentStatus =
  | 'created'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'expired';

export type WebhookEventType =
  | 'payment_intent.created'
  | 'payment_intent.succeeded'
  | 'payment_intent.failed'
  | 'payment_intent.canceled'
  | 'payment_intent.expired';

export interface PaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: Currency;
  wallet: WalletType;
  status: PaymentIntentStatus;
  description: string | null;
  metadata: string | null;
  paymentLink: string | null;
  qrData: string | null;
  senderName: string | null;
  clientReferenceId: string | null;
  createdAt: number;
  expiresAt: number;
  succeededAt: number | null;
  canceledAt: number | null;
  livemode: boolean;
}

export interface CreatePaymentIntentParams {
  walletType: WalletType;
  amount: number;
  description?: string;
  metadata?: string;
  recipientId?: string;
  expirationMinutes?: number;
  idempotencyKey?: string;
  clientReferenceId?: string;
}

export interface ListPaymentIntentsParams {
  status?: PaymentIntentStatus;
  walletType?: WalletType;
  limit?: number;
  offset?: number;
}

export interface WebhookEndpoint {
  id: string;
  object: 'webhook_endpoint';
  url: string;
  secret?: string;
  enabledEvents: WebhookEventType[];
  description: string | null;
  active: boolean;
  createdAt: number;
}

export interface CreateWebhookEndpointParams {
  url: string;
  enabledEvents: WebhookEventType[];
  description?: string;
}

export interface WebhookEvent<T extends WebhookEventType = WebhookEventType> {
  id: string;
  object: 'event';
  type: T;
  createdAt: number;
  data: PaymentIntent;
}

export interface Wallet {
  type: WalletType;
  displayName: string;
  country: string;
  currency: Currency;
  installed: boolean;
}

export interface Health {
  status: 'ok';
  version: string;
  uptime: number;
  serverPort: number;
  activeWallets: number;
  localIp: string | null;
}

export interface ApiErrorBody {
  error: { type: string; message: string };
}
