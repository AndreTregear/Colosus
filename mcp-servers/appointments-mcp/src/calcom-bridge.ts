/**
 * Cal.com ↔ appointments-mcp Bridge
 *
 * Integration layer that keeps Cal.com and the appointments-mcp Postgres
 * tables in sync. Handles three flows:
 *
 *  1. Cal.com → Postgres: Webhook receives Cal.com booking events and
 *     upserts them into the appointments table.
 *  2. Postgres → Cal.com: When appointments-mcp books via WhatsApp, this
 *     module creates the corresponding Cal.com event via REST API.
 *  3. Shared availability: Merges Cal.com busy blocks with appointments-mcp
 *     blocks so neither system double-books.
 */

import pg from "pg";

const { Pool } = pg;

// ── Configuration ────────────────────────────────────

const CAL_COM_API_URL = process.env.CAL_COM_API_URL || "http://localhost:3000/api/v1";
const CAL_COM_API_KEY = process.env.CAL_COM_API_KEY || "";
const DB_URL = process.env.APPOINTMENTS_DATABASE_URL || process.env.DATABASE_URL || "postgresql://localhost:5432/appointments";
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || "America/Lima";

// ── Database ─────────────────────────────────────────

const pool = new Pool({ connectionString: DB_URL });

async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ── Cal.com REST helpers ─────────────────────────────

interface CalComRequestOptions {
  method: string;
  path: string;
  body?: Record<string, any>;
}

async function calcomRequest<T = any>(opts: CalComRequestOptions): Promise<T> {
  if (!CAL_COM_API_KEY) {
    throw new Error("CAL_COM_API_KEY is not configured. Set the environment variable.");
  }

  const url = `${CAL_COM_API_URL}${opts.path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CAL_COM_API_KEY}`,
  };

  const res = await fetch(url, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Cal.com API ${opts.method} ${opts.path} failed (${res.status}): ${errBody}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────

interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: { name: string; email: string; phone?: string }[];
  eventTypeId: number;
  metadata?: Record<string, any>;
}

interface CalComAvailabilitySlot {
  start: string;
  end: string;
}

interface CalComEventType {
  id: number;
  slug: string;
  title: string;
  length: number;
  metadata?: Record<string, any>;
}

// ── Flow 1: Cal.com → Postgres (Webhook handler) ────

/**
 * Process an incoming Cal.com webhook payload. Call this from your HTTP
 * webhook endpoint (e.g. Express/Fastify route that receives POST
 * /webhooks/calcom).
 *
 * Supported triggers:
 *   BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 */
export async function handleCalComWebhook(
  trigger: string,
  payload: Record<string, any>
): Promise<{ action: string; appointmentId?: number }> {
  const booking = payload as unknown as CalComBooking;

  switch (trigger) {
    case "BOOKING_CREATED":
    case "BOOKING_RESCHEDULED":
      return await upsertBookingFromCalCom(booking);

    case "BOOKING_CANCELLED":
      return await cancelBookingFromCalCom(booking);

    default:
      return { action: "ignored" };
  }
}

/**
 * Insert or update an appointment from a Cal.com booking event. Maps
 * Cal.com attendee info → appointments table fields. The Cal.com booking
 * UID is stored in the notes field as a reference so we can avoid
 * duplicates and enable bidirectional sync.
 */
async function upsertBookingFromCalCom(
  booking: CalComBooking
): Promise<{ action: string; appointmentId: number }> {
  const attendee = booking.attendees?.[0];
  const customerName = attendee?.name || "Cal.com Booking";
  const customerPhone = attendee?.phone || "";
  const customerEmail = attendee?.email || "";
  const calcomRef = `calcom:${booking.uid}`;

  // Try to map Cal.com event type → our service
  const serviceId = await resolveServiceFromEventType(booking.eventTypeId);
  // Resolve provider from metadata or default
  const providerId = await resolveProviderFromBooking(booking);

  // Check if we already have this booking (by calcom ref in notes)
  const existing = await query(
    `SELECT id FROM appointments WHERE notes LIKE $1 LIMIT 1`,
    [`%${calcomRef}%`]
  );

  if (existing.rows.length > 0) {
    // Update (reschedule)
    const apptId = existing.rows[0].id;
    const endTime = new Date(booking.endTime);
    await query(
      `UPDATE appointments
       SET datetime = $2, end_time = $3,
           customer_name = $4, customer_phone = $5, customer_email = $6,
           status = 'booked',
           reminder_sent_24h = false, reminder_sent_2h = false
       WHERE id = $1`,
      [apptId, booking.startTime, endTime.toISOString(), customerName, customerPhone, customerEmail]
    );
    return { action: "rescheduled", appointmentId: apptId };
  }

  // Insert new
  const result = await query(
    `INSERT INTO appointments
     (service_id, provider_id, customer_name, customer_phone, customer_email,
      datetime, end_time, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'booked', $8)
     RETURNING id`,
    [
      serviceId,
      providerId,
      customerName,
      customerPhone,
      customerEmail,
      booking.startTime,
      booking.endTime,
      `Booked via Cal.com | ${calcomRef}`,
    ]
  );

  return { action: "created", appointmentId: result.rows[0].id };
}

async function cancelBookingFromCalCom(
  booking: CalComBooking
): Promise<{ action: string; appointmentId?: number }> {
  const calcomRef = `calcom:${booking.uid}`;

  const existing = await query(
    `SELECT id FROM appointments WHERE notes LIKE $1 AND status != 'cancelled' LIMIT 1`,
    [`%${calcomRef}%`]
  );

  if (existing.rows.length === 0) {
    return { action: "not_found" };
  }

  const apptId = existing.rows[0].id;
  await query(
    `UPDATE appointments
     SET status = 'cancelled', cancelled_at = NOW(),
         cancellation_reason = 'Cancelled via Cal.com'
     WHERE id = $1`,
    [apptId]
  );

  return { action: "cancelled", appointmentId: apptId };
}

// ── Flow 2: Postgres → Cal.com (create event) ───────

/**
 * After appointments-mcp books an appointment (e.g. via WhatsApp), call
 * this to push the booking to Cal.com so it shows on the provider's
 * Cal.com calendar.
 */
export async function pushAppointmentToCalCom(appointmentId: number): Promise<{
  calcomBookingId?: number;
  calcomBookingUid?: string;
  error?: string;
}> {
  if (!CAL_COM_API_KEY) {
    return { error: "Cal.com API key not configured" };
  }

  const result = await query(
    `SELECT a.*, s.name as service_name, s.duration_minutes,
            p.name as provider_name, p.email as provider_email
     FROM appointments a
     JOIN services s ON a.service_id = s.id
     JOIN providers p ON a.provider_id = p.id
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (result.rows.length === 0) {
    return { error: `Appointment ${appointmentId} not found` };
  }

  const appt = result.rows[0];

  // Find the Cal.com event type that matches this service
  const eventTypeId = await resolveCalComEventType(appt.service_id);
  if (!eventTypeId) {
    return { error: `No Cal.com event type mapped for service ${appt.service_id}` };
  }

  try {
    const booking = await calcomRequest<{ booking: CalComBooking }>({
      method: "POST",
      path: "/bookings",
      body: {
        eventTypeId,
        start: appt.datetime,
        end: appt.end_time,
        responses: {
          name: appt.customer_name,
          email: appt.customer_email || `${appt.customer_phone}@placeholder.local`,
          phone: appt.customer_phone,
        },
        metadata: {
          source: "appointments-mcp",
          appointmentId: appt.id,
        },
        timeZone: BUSINESS_TIMEZONE,
        language: "es",
      },
    });

    // Store Cal.com reference back in our appointment
    const calcomRef = `calcom:${booking.booking.uid}`;
    const existingNotes = appt.notes || "";
    const newNotes = existingNotes
      ? `${existingNotes} | ${calcomRef}`
      : calcomRef;

    await query("UPDATE appointments SET notes = $2 WHERE id = $1", [appointmentId, newNotes]);

    return {
      calcomBookingId: booking.booking.id,
      calcomBookingUid: booking.booking.uid,
    };
  } catch (err: any) {
    return { error: `Cal.com booking creation failed: ${err.message}` };
  }
}

/**
 * Cancel a booking on Cal.com when it is cancelled in appointments-mcp.
 */
export async function cancelAppointmentOnCalCom(appointmentId: number): Promise<{
  cancelled: boolean;
  error?: string;
}> {
  if (!CAL_COM_API_KEY) {
    return { cancelled: false, error: "Cal.com API key not configured" };
  }

  const result = await query("SELECT notes FROM appointments WHERE id = $1", [appointmentId]);
  if (result.rows.length === 0) {
    return { cancelled: false, error: "Appointment not found" };
  }

  const notes: string = result.rows[0].notes || "";
  const uidMatch = notes.match(/calcom:([a-zA-Z0-9_-]+)/);
  if (!uidMatch) {
    return { cancelled: false, error: "No Cal.com booking reference found" };
  }

  try {
    await calcomRequest({
      method: "DELETE",
      path: `/bookings/${uidMatch[1]}/cancel`,
      body: { reason: "Cancelled via appointments-mcp" },
    });
    return { cancelled: true };
  } catch (err: any) {
    return { cancelled: false, error: err.message };
  }
}

// ── Flow 3: Shared availability ──────────────────────

/**
 * Get Cal.com busy slots for a provider on a given date range. These
 * blocks are merged with appointments-mcp bookings in the slot generation
 * logic to produce a unified availability view.
 */
export async function getCalComBusySlots(
  providerId: number,
  dateFrom: string,
  dateTo: string
): Promise<{ start: string; end: string }[]> {
  if (!CAL_COM_API_KEY) {
    return []; // No Cal.com configured — no extra blocks
  }

  // Look up Cal.com user for this provider
  const provResult = await query(
    "SELECT email FROM providers WHERE id = $1",
    [providerId]
  );
  if (provResult.rows.length === 0) return [];

  const email = provResult.rows[0].email;
  if (!email) return [];

  try {
    const data = await calcomRequest<{ busy: CalComAvailabilitySlot[] }>({
      method: "GET",
      path: `/availability?dateFrom=${dateFrom}&dateTo=${dateTo}&username=${encodeURIComponent(email)}`,
    });

    return (data.busy || []).map((slot) => ({
      start: slot.start,
      end: slot.end,
    }));
  } catch {
    // If availability check fails, return empty — don't block booking
    return [];
  }
}

/**
 * Generate a Cal.com booking link for a specific service. Useful for
 * sharing on Instagram, website, or WhatsApp status.
 */
export async function generateBookingLink(
  serviceId: number,
  providerId?: number
): Promise<{ url: string; eventType: string } | { error: string }> {
  if (!CAL_COM_API_KEY) {
    return { error: "Cal.com not configured" };
  }

  const eventTypeId = await resolveCalComEventType(serviceId);
  if (!eventTypeId) {
    return { error: `No Cal.com event type mapped for service ${serviceId}` };
  }

  try {
    const eventType = await calcomRequest<CalComEventType>({
      method: "GET",
      path: `/event-types/${eventTypeId}`,
    });

    // Build the booking URL
    const baseUrl = CAL_COM_API_URL.replace("/api/v1", "");
    let bookingUrl = `${baseUrl}/${eventType.slug}`;

    // If a specific provider is requested, add their username
    if (providerId) {
      const provResult = await query(
        "SELECT email FROM providers WHERE id = $1",
        [providerId]
      );
      if (provResult.rows.length > 0 && provResult.rows[0].email) {
        const username = provResult.rows[0].email.split("@")[0];
        bookingUrl = `${baseUrl}/${username}/${eventType.slug}`;
      }
    }

    return { url: bookingUrl, eventType: eventType.title };
  } catch (err: any) {
    return { error: `Failed to generate booking link: ${err.message}` };
  }
}

/**
 * Trigger a full sync between Cal.com and appointments-mcp. Pulls all
 * upcoming Cal.com bookings and upserts them into the appointments table.
 */
export async function syncCalComBookings(): Promise<{
  synced: number;
  errors: string[];
}> {
  if (!CAL_COM_API_KEY) {
    return { synced: 0, errors: ["Cal.com API key not configured"] };
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const data = await calcomRequest<{ bookings: CalComBooking[] }>({
      method: "GET",
      path: `/bookings?dateFrom=${now.toISOString()}&dateTo=${futureDate.toISOString()}&status=accepted`,
    });

    const bookings = data.bookings || [];
    let synced = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      try {
        await upsertBookingFromCalCom(booking);
        synced++;
      } catch (err: any) {
        errors.push(`Booking ${booking.uid}: ${err.message}`);
      }
    }

    return { synced, errors };
  } catch (err: any) {
    return { synced: 0, errors: [err.message] };
  }
}

// ── Mapping helpers ──────────────────────────────────

/**
 * Map a Cal.com event type ID to our internal service ID. Uses the
 * calcom_event_type_mappings table if it exists, otherwise falls back
 * to matching by name.
 */
async function resolveServiceFromEventType(eventTypeId: number): Promise<number> {
  // Try mapping table first
  try {
    const mapResult = await query(
      "SELECT service_id FROM calcom_event_type_mappings WHERE calcom_event_type_id = $1 LIMIT 1",
      [eventTypeId]
    );
    if (mapResult.rows.length > 0) return mapResult.rows[0].service_id;
  } catch {
    // Table may not exist yet — fall through
  }

  // Fallback: return first active service
  const fallback = await query(
    "SELECT id FROM services WHERE active = true ORDER BY id LIMIT 1"
  );
  if (fallback.rows.length > 0) return fallback.rows[0].id;

  throw new Error("No services configured. Create at least one service.");
}

/**
 * Map a Cal.com event type ID to our internal service's Cal.com event
 * type. Reverse lookup for pushing appointments to Cal.com.
 */
async function resolveCalComEventType(serviceId: number): Promise<number | null> {
  try {
    const result = await query(
      "SELECT calcom_event_type_id FROM calcom_event_type_mappings WHERE service_id = $1 LIMIT 1",
      [serviceId]
    );
    if (result.rows.length > 0) return result.rows[0].calcom_event_type_id;
  } catch {
    // Table may not exist
  }
  return null;
}

/**
 * Resolve which provider a Cal.com booking belongs to. Checks metadata
 * first, then tries to match by provider email.
 */
async function resolveProviderFromBooking(booking: CalComBooking): Promise<number> {
  // Check metadata for explicit provider ID
  if (booking.metadata?.providerId) {
    return booking.metadata.providerId;
  }

  // Try matching the booking organizer email to a provider
  if (booking.attendees?.length > 0) {
    for (const attendee of booking.attendees) {
      const provResult = await query(
        "SELECT id FROM providers WHERE email = $1 AND active = true LIMIT 1",
        [attendee.email]
      );
      if (provResult.rows.length > 0) return provResult.rows[0].id;
    }
  }

  // Fallback: first active provider
  const fallback = await query(
    "SELECT id FROM providers WHERE active = true ORDER BY id LIMIT 1"
  );
  if (fallback.rows.length > 0) return fallback.rows[0].id;

  throw new Error("No providers configured. Create at least one provider.");
}

// ── Schema extension for Cal.com mapping ─────────────

/**
 * Call this from ensureSchema() to create the Cal.com mapping table.
 */
export const CALCOM_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS calcom_event_type_mappings (
  id                    SERIAL PRIMARY KEY,
  service_id            INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  calcom_event_type_id  INTEGER NOT NULL,
  calcom_event_slug     VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id),
  UNIQUE(calcom_event_type_id)
);
`;

export { pool, query };
