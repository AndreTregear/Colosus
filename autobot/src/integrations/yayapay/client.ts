import type {
  ApiErrorBody,
  CreatePaymentIntentParams,
  CreateWebhookEndpointParams,
  Health,
  ListPaymentIntentsParams,
  PaymentIntent,
  Wallet,
  WebhookEndpoint,
} from './types.js';

export interface YayaPayOptions {
  baseUrl: string;
  apiKey: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

export class YayaPayError extends Error {
  constructor(
    public readonly status: number,
    public readonly type: string,
    message: string,
  ) {
    super(message);
    this.name = 'YayaPayError';
  }
}

export class YayaPay {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(opts: YayaPayOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 10_000;
  }

  paymentIntents = {
    create: (params: CreatePaymentIntentParams): Promise<PaymentIntent> =>
      this.request('POST', '/v1/payment_intents', params),
    retrieve: (id: string): Promise<PaymentIntent> =>
      this.request('GET', `/v1/payment_intents/${encodeURIComponent(id)}`),
    cancel: (id: string): Promise<PaymentIntent> =>
      this.request('POST', `/v1/payment_intents/${encodeURIComponent(id)}/cancel`),
    list: (params: ListPaymentIntentsParams = {}): Promise<PaymentIntent[]> => {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.walletType) q.set('walletType', params.walletType);
      if (params.limit != null) q.set('limit', String(params.limit));
      if (params.offset != null) q.set('offset', String(params.offset));
      const qs = q.toString();
      return this.request('GET', `/v1/payment_intents${qs ? `?${qs}` : ''}`);
    },
  };

  webhookEndpoints = {
    create: (params: CreateWebhookEndpointParams): Promise<WebhookEndpoint> =>
      this.request('POST', '/v1/webhook_endpoints', params),
    list: (): Promise<WebhookEndpoint[]> => this.request('GET', '/v1/webhook_endpoints'),
    delete: (id: string): Promise<void> =>
      this.request('DELETE', `/v1/webhook_endpoints/${encodeURIComponent(id)}`),
  };

  wallets = {
    list: (): Promise<Wallet[]> => this.request('GET', '/v1/wallets'),
  };

  health = (): Promise<Health> => this.request('GET', '/health', undefined, false);

  test = {
    simulateNotification: (params: {
      walletType: string;
      senderName: string;
      amount: number;
      currency?: string;
    }): Promise<{ notificationId: number; matched: boolean; matchedIntentId: string | null }> =>
      this.request('POST', '/v1/test/simulate_notification', params),
  };

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
    auth = true,
  ): Promise<T> {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...(auth ? { Authorization: `Bearer ${this.apiKey}` } : {}),
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const parsed = text.length ? (JSON.parse(text) as unknown) : undefined;

    if (!res.ok) {
      const err = parsed as ApiErrorBody | undefined;
      throw new YayaPayError(
        res.status,
        err?.error?.type ?? 'api_error',
        err?.error?.message ?? `HTTP ${res.status}`,
      );
    }
    return parsed as T;
  }
}
