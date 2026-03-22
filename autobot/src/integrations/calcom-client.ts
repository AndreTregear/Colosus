/**
 * Cal.com API Client — appointments, booking, availability
 * Replaces custom appointment code with calls to our self-hosted Cal.com instance.
 */

import { CALCOM_API_URL, CALCOM_API_KEY } from '../config.js';
import { logger } from '../shared/logger.js';

const TIMEOUT_MS = 8_000;

// ── Helpers ──

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

function apiUrl(path: string): string {
  // Cal.com REST API uses apiKey as query param
  const sep = path.includes('?') ? '&' : '?';
  return `${CALCOM_API_URL}/api${path}${sep}apiKey=${CALCOM_API_KEY}`;
}

async function calFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const url = apiUrl(path);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...headers(), ...(init.headers as Record<string, string> ?? {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, body, path }, 'Cal.com API error');
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.error({ err, path }, 'Cal.com API request failed');
    return null;
  }
}

// ── Health ──

export async function isServiceAvailable(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/event-types'), {
      headers: headers(),
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Event Types ──

export interface CalEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
}

export async function listEventTypes(): Promise<CalEventType[]> {
  const result = await calFetch<{ event_types: CalEventType[] }>('/event-types');
  return result?.event_types ?? [];
}

// ── Availability ──

export interface CalAvailabilitySlot {
  time: string;
}

export async function getAvailability(
  eventTypeId: number,
  dateFrom: string,
  dateTo: string,
): Promise<CalAvailabilitySlot[]> {
  const result = await calFetch<{ slots: Record<string, CalAvailabilitySlot[]> }>(
    `/availability?eventTypeId=${eventTypeId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
  if (!result?.slots) return [];
  // Flatten all date keys into a single array
  return Object.values(result.slots).flat();
}

// ── Bookings ──

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  attendees: Array<{ email: string; name: string }>;
  description?: string;
}

export async function createBooking(params: {
  eventTypeId: number;
  start: string;
  end: string;
  name: string;
  email: string;
  notes?: string;
  metadata?: Record<string, string>;
}): Promise<CalBooking | null> {
  const result = await calFetch<CalBooking>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      eventTypeId: params.eventTypeId,
      start: params.start,
      end: params.end,
      responses: {
        name: params.name,
        email: params.email,
        notes: params.notes ?? '',
      },
      metadata: params.metadata ?? {},
    }),
  });
  return result;
}

export async function cancelBooking(bookingId: number, reason?: string): Promise<boolean> {
  const result = await calFetch(`/bookings/${bookingId}/cancel`, {
    method: 'DELETE',
    body: JSON.stringify({ reason: reason ?? '' }),
  });
  return result !== null;
}

export async function getBooking(bookingUid: string): Promise<CalBooking | null> {
  const result = await calFetch<{ booking: CalBooking }>(`/bookings/${encodeURIComponent(bookingUid)}`);
  return result?.booking ?? null;
}

export async function listBookings(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<CalBooking[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  const qs = params.toString();
  const path = qs ? `/bookings?${qs}` : '/bookings';
  const result = await calFetch<{ bookings: CalBooking[] }>(path);
  return result?.bookings ?? [];
}
