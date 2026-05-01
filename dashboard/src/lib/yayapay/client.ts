/**
 * yayapay-server REST client.
 *
 * Talks to the Rust backend running on Lambda over the Tailscale tailnet
 * (default: http://lambda:3000). Server-side use only — never import this
 * from a client component, the API key must not reach the browser.
 */

const YAYAPAY_BASE_URL =
  process.env.YAYAPAY_BASE_URL ?? 'http://lambda:3000';
const YAYAPAY_API_KEY = process.env.YAYAPAY_API_KEY ?? '';

if (typeof window !== 'undefined') {
  throw new Error('lib/yayapay/client must not be imported from the browser');
}

export type WalletType = 'YAPE' | 'PLIN';
export type Currency = 'PEN';

export type PaymentIntentStatus =
  | 'pending'
  | 'confirmed'
  | 'expired'
  | 'canceled';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  wallet_type: WalletType;
  status: PaymentIntentStatus;
  qr_data: string | null;
  payment_link: string | null;
  sender_name: string | null;
  description: string | null;
  created_at: string;
  expires_at: string;
  confirmed_at: string | null;
}

export interface CreatePaymentIntentInput {
  amountCents: number;
  walletType?: WalletType;
  description?: string;
  idempotencyKey?: string;
}

export class YayapayError extends Error {
  constructor(
    message: string,
    public status: number,
    public type?: string,
  ) {
    super(message);
    this.name = 'YayapayError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  if (!YAYAPAY_API_KEY) {
    throw new YayapayError(
      'YAYAPAY_API_KEY env var not set',
      500,
      'config_error',
    );
  }

  const url = `${YAYAPAY_BASE_URL}${path}`;
  const timeoutMs = init.timeoutMs ?? 10_000;

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${YAYAPAY_API_KEY}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let body: unknown = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      // Fall through: non-JSON error body
    }
  }

  if (!res.ok) {
    const errorBody = body as { error?: { type?: string; message?: string } } | null;
    const message =
      errorBody?.error?.message ?? text ?? `yayapay HTTP ${res.status}`;
    const type = errorBody?.error?.type;
    throw new YayapayError(message, res.status, type);
  }

  return body as T;
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntent> {
  return request<PaymentIntent>('/api/v1/merchant/payment_intents', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amountCents,
      wallet_type: input.walletType ?? 'YAPE',
      description: input.description,
      idempotency_key: input.idempotencyKey,
    }),
  });
}

export async function getPaymentIntent(id: string): Promise<PaymentIntent> {
  return request<PaymentIntent>(
    `/api/v1/merchant/payment_intents/${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
}

export async function cancelPaymentIntent(id: string): Promise<PaymentIntent> {
  return request<PaymentIntent>(
    `/api/v1/merchant/payment_intents/${encodeURIComponent(id)}/cancel`,
    { method: 'POST' },
  );
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${YAYAPAY_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
