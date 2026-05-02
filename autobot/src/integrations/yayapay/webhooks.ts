import { createHmac } from 'node:crypto';
import type { WebhookEvent } from './types.js';
import { timingSafeStringEqual } from '../../shared/secrets.js';

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}

// Verify a yaya_pay webhook signature. Pass the RAW request body bytes —
// re-serialised JSON will not match the HMAC.
export function verifyWebhook<T extends WebhookEvent = WebhookEvent>(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string,
  toleranceSeconds = 300,
): T {
  if (!signatureHeader) throw new WebhookSignatureError('Missing YayaPay-Signature header');

  const parts: Record<string, string> = {};
  for (const piece of signatureHeader.split(',')) {
    const idx = piece.indexOf('=');
    if (idx === -1) continue;
    parts[piece.slice(0, idx).trim()] = piece.slice(idx + 1).trim();
  }
  const tStr = parts['t'];
  const v1 = parts['v1'];
  if (!tStr || !v1) throw new WebhookSignatureError('Malformed signature header');

  const ts = Number(tStr);
  if (!Number.isFinite(ts)) throw new WebhookSignatureError('Invalid timestamp');
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) {
    throw new WebhookSignatureError('Signature outside tolerance window');
  }

  const bodyBuf = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const signedPayload = Buffer.concat([Buffer.from(`${ts}.`, 'utf8'), bodyBuf]);
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');
  if (!timingSafeStringEqual(expected, v1)) {
    throw new WebhookSignatureError('Signature mismatch');
  }
  return JSON.parse(bodyBuf.toString('utf8')) as T;
}
