#!/usr/bin/env node
/**
 * Appointments MCP Server
 * Standalone appointment booking system with PostgreSQL backend
 * and optional calendar sync (Google Calendar, CalDAV).
 *
 * Tools:
 *  BOOKING:  get_available_slots, book_appointment, cancel_appointment,
 *            reschedule_appointment, get_appointment, list_appointments
 *  SERVICES: list_services, create_service
 *  PROVIDERS: list_providers, get_provider_schedule, set_working_hours
 *  REMINDERS: send_reminder, list_no_shows
 *  CALENDAR:  sync_google_calendar, sync_caldav, get_external_events
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";

const { Pool } = pg;

// ── Configuration ────────────────────────────────────

const DB_URL = process.env.APPOINTMENTS_DATABASE_URL || process.env.DATABASE_URL || "postgresql://localhost:5432/appointments";
const BUFFER_MINUTES = parseInt(process.env.APPOINTMENT_BUFFER || "10", 10);
const ADVANCE_DAYS = parseInt(process.env.APPOINTMENT_ADVANCE_DAYS || "30", 10);
const CANCELLATION_WINDOW_HOURS = parseInt(process.env.CANCELLATION_WINDOW_HOURS || "24", 10);
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || "America/Lima";

// ── PostgreSQL Pool ──────────────────────────────────

const pool = new Pool({ connectionString: DB_URL });

async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ── Schema Creation ──────────────────────────────────

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0,
  description   TEXT,
  category      VARCHAR(100),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  specialties   TEXT[],
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_schedules (
  id            SERIAL PRIMARY KEY,
  provider_id   INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  break_start   TIME,
  break_end     TIME,
  UNIQUE(provider_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS appointments (
  id              SERIAL PRIMARY KEY,
  service_id      INTEGER NOT NULL REFERENCES services(id),
  provider_id     INTEGER NOT NULL REFERENCES providers(id),
  customer_name   VARCHAR(255) NOT NULL,
  customer_phone  VARCHAR(50),
  customer_email  VARCHAR(255),
  datetime        TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'booked'
                  CHECK (status IN ('booked','confirmed','cancelled','completed','no_show')),
  notes           TEXT,
  reminder_sent_24h BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_2h  BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appointments_provider_datetime
  ON appointments(provider_id, datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone
  ON appointments(customer_phone);

CREATE TABLE IF NOT EXISTS calendar_syncs (
  id                  SERIAL PRIMARY KEY,
  provider_id         INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  type                VARCHAR(20) NOT NULL CHECK (type IN ('google','outlook','caldav')),
  credentials_encrypted TEXT,
  calendar_url        TEXT,
  last_sync           TIMESTAMPTZ,
  sync_enabled        BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_events (
  id              SERIAL PRIMARY KEY,
  calendar_sync_id INTEGER NOT NULL REFERENCES calendar_syncs(id) ON DELETE CASCADE,
  provider_id     INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  external_id     VARCHAR(500),
  title           VARCHAR(500),
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  all_day         BOOLEAN NOT NULL DEFAULT false,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_events_provider_time
  ON external_events(provider_id, start_time, end_time);
`;

async function ensureSchema() {
  await query(SCHEMA_SQL);
  console.error("Database schema ensured.");
}

// ── Helpers ──────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Generate time slots for a provider on a given date */
async function generateSlots(
  providerId: number,
  date: string,
  durationMinutes: number
): Promise<{ start: string; end: string }[]> {
  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  // Get working hours for this day
  const schedResult = await query(
    `SELECT start_time, end_time, break_start, break_end
     FROM provider_schedules
     WHERE provider_id = $1 AND day_of_week = $2`,
    [providerId, dayOfWeek]
  );

  if (schedResult.rows.length === 0) return [];
  const sched = schedResult.rows[0];

  // Get existing appointments for this provider on this date
  const apptResult = await query(
    `SELECT datetime, end_time FROM appointments
     WHERE provider_id = $1
       AND datetime::date = $2::date
       AND status NOT IN ('cancelled')
     ORDER BY datetime`,
    [providerId, date]
  );

  // Get external calendar events blocking this provider
  const extResult = await query(
    `SELECT start_time, end_time FROM external_events
     WHERE provider_id = $1
       AND start_time::date <= $2::date
       AND end_time::date >= $2::date`,
    [providerId, date]
  );

  const blocked: { start: Date; end: Date }[] = [];
  for (const row of apptResult.rows) {
    const s = new Date(row.datetime);
    const e = new Date(row.end_time);
    // Add buffer time around existing appointments
    blocked.push({
      start: new Date(s.getTime() - BUFFER_MINUTES * 60000),
      end: new Date(e.getTime() + BUFFER_MINUTES * 60000),
    });
  }
  for (const row of extResult.rows) {
    blocked.push({
      start: new Date(row.start_time),
      end: new Date(row.end_time),
    });
  }

  // Parse working hours into Date objects for this date
  const parseTime = (timeStr: string): Date => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(date + "T00:00:00");
    d.setHours(h, m, 0, 0);
    return d;
  };

  const workStart = parseTime(sched.start_time);
  const workEnd = parseTime(sched.end_time);
  const breakStart = sched.break_start ? parseTime(sched.break_start) : null;
  const breakEnd = sched.break_end ? parseTime(sched.break_end) : null;

  const slots: { start: string; end: string }[] = [];
  const slotDuration = durationMinutes * 60000;
  let cursor = workStart.getTime();
  const now = Date.now();

  while (cursor + slotDuration <= workEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor + slotDuration);

    // Skip past times
    if (slotStart.getTime() < now) {
      cursor += 15 * 60000; // advance by 15 min
      continue;
    }

    // Skip break time
    if (breakStart && breakEnd) {
      if (slotStart < breakEnd && slotEnd > breakStart) {
        cursor = breakEnd.getTime();
        continue;
      }
    }

    // Check against blocked times
    const isBlocked = blocked.some(
      (b) => slotStart < b.end && slotEnd > b.start
    );

    if (!isBlocked) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    cursor += 15 * 60000; // 15-minute slot granularity
  }

  return slots;
}

/** Send a WhatsApp message via configured API */
async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) {
    console.error(`[WhatsApp] No API configured. Message to ${phone}: ${message}`);
    return false;
  }
  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });
    return res.ok;
  } catch (err: any) {
    console.error(`[WhatsApp] Send failed: ${err.message}`);
    return false;
  }
}

// ── Tool Definitions ─────────────────────────────────

const TOOLS = [
  // ── BOOKING ──
  {
    name: "get_available_slots",
    description:
      "Get available appointment time slots for a service, provider, and date range. " +
      "Considers working hours, existing bookings, buffer time, and synced external calendar events.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service_id: { type: "number", description: "Service ID" },
        provider_id: { type: "number", description: "Provider ID (optional — if omitted, checks all active providers)" },
        date_from: { type: "string", description: "Start date (ISO format, e.g. 2026-03-21)" },
        date_to: { type: "string", description: "End date (ISO format, optional — defaults to date_from)" },
      },
      required: ["service_id", "date_from"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Book an appointment slot. Returns confirmation with appointment_id. " +
      "Validates that the slot is still available before booking.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer_name: { type: "string", description: "Customer full name" },
        customer_phone: { type: "string", description: "Customer phone/WhatsApp number" },
        customer_email: { type: "string", description: "Customer email (optional)" },
        service_id: { type: "number", description: "Service ID" },
        provider_id: { type: "number", description: "Provider ID" },
        datetime: { type: "string", description: "Appointment start time (ISO format)" },
        notes: { type: "string", description: "Additional notes (optional)" },
      },
      required: ["customer_name", "customer_phone", "service_id", "provider_id", "datetime"],
    },
  },
  {
    name: "cancel_appointment",
    description:
      "Cancel an appointment by ID. Enforces cancellation policy (configurable window, e.g. 24h notice).",
    inputSchema: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "number", description: "Appointment ID" },
        reason: { type: "string", description: "Cancellation reason (optional)" },
        force: { type: "boolean", description: "Force cancel even outside cancellation window (for staff use)" },
      },
      required: ["appointment_id"],
    },
  },
  {
    name: "reschedule_appointment",
    description: "Move an existing appointment to a new time slot. Validates new slot availability.",
    inputSchema: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "number", description: "Appointment ID to reschedule" },
        new_datetime: { type: "string", description: "New appointment start time (ISO format)" },
      },
      required: ["appointment_id", "new_datetime"],
    },
  },
  {
    name: "get_appointment",
    description: "Get full details of a specific appointment by ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "number", description: "Appointment ID" },
      },
      required: ["appointment_id"],
    },
  },
  {
    name: "list_appointments",
    description:
      "List appointments with filters. Supports filtering by date range, provider, customer phone, and status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        date_from: { type: "string", description: "Start date filter (ISO format, optional)" },
        date_to: { type: "string", description: "End date filter (ISO format, optional)" },
        provider_id: { type: "number", description: "Filter by provider (optional)" },
        customer_phone: { type: "string", description: "Filter by customer phone (optional)" },
        status: {
          type: "string",
          enum: ["booked", "confirmed", "cancelled", "completed", "no_show"],
          description: "Filter by status (optional)",
        },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },

  // ── SERVICES ──
  {
    name: "list_services",
    description: "List available services with duration, price, and description. Optionally filter by category.",
    inputSchema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Filter by category (optional)" },
        active_only: { type: "boolean", description: "Only active services (default true)" },
      },
      required: [],
    },
  },
  {
    name: "create_service",
    description: "Add a new service to the catalog.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Service name" },
        duration_minutes: { type: "number", description: "Duration in minutes" },
        price: { type: "number", description: "Price" },
        description: { type: "string", description: "Service description (optional)" },
        category: { type: "string", description: "Category (optional)" },
      },
      required: ["name", "duration_minutes", "price"],
    },
  },

  // ── PROVIDERS ──
  {
    name: "list_providers",
    description: "List staff/providers with their specialties. Optionally filter by active status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        active_only: { type: "boolean", description: "Only active providers (default true)" },
      },
      required: [],
    },
  },
  {
    name: "get_provider_schedule",
    description:
      "Get a provider's working hours and real availability for a date range, " +
      "including existing appointments and external calendar blocks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        provider_id: { type: "number", description: "Provider ID" },
        date_from: { type: "string", description: "Start date (ISO format)" },
        date_to: { type: "string", description: "End date (ISO format, optional — defaults to date_from)" },
      },
      required: ["provider_id", "date_from"],
    },
  },
  {
    name: "set_working_hours",
    description:
      "Set or update a provider's working hours for a specific day of week. " +
      "day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday.",
    inputSchema: {
      type: "object" as const,
      properties: {
        provider_id: { type: "number", description: "Provider ID" },
        day_of_week: { type: "number", description: "Day of week (0=Sun, 1=Mon, ..., 6=Sat)" },
        start_time: { type: "string", description: "Work start time (HH:MM, e.g. 09:00)" },
        end_time: { type: "string", description: "Work end time (HH:MM, e.g. 18:00)" },
        break_start: { type: "string", description: "Break start time (HH:MM, optional)" },
        break_end: { type: "string", description: "Break end time (HH:MM, optional)" },
      },
      required: ["provider_id", "day_of_week", "start_time", "end_time"],
    },
  },

  // ── REMINDERS ──
  {
    name: "send_reminder",
    description:
      "Send an appointment reminder to the customer via WhatsApp. " +
      "Specify type: '24h' for day-before reminder or '2h' for same-day reminder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        appointment_id: { type: "number", description: "Appointment ID" },
        type: {
          type: "string",
          enum: ["24h", "2h"],
          description: "Reminder type: 24h (day before) or 2h (same day)",
        },
      },
      required: ["appointment_id", "type"],
    },
  },
  {
    name: "list_no_shows",
    description:
      "List customers who didn't show up for recent appointments. " +
      "Useful for follow-up or policy decisions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        days_back: { type: "number", description: "Look back this many days (default 30)" },
        min_no_shows: { type: "number", description: "Minimum no-show count to include (default 1)" },
      },
      required: [],
    },
  },

  // ── CALENDAR SYNC ──
  {
    name: "sync_google_calendar",
    description:
      "Initiate or refresh Google Calendar sync for a provider. " +
      "On first call, returns an OAuth2 authorization URL. On subsequent calls, syncs events.",
    inputSchema: {
      type: "object" as const,
      properties: {
        provider_id: { type: "number", description: "Provider ID" },
        auth_code: { type: "string", description: "OAuth2 authorization code (from callback, optional)" },
      },
      required: ["provider_id"],
    },
  },
  {
    name: "sync_caldav",
    description:
      "Sync with a CalDAV server (Nextcloud, Apple Calendar, Radicale, etc.).",
    inputSchema: {
      type: "object" as const,
      properties: {
        provider_id: { type: "number", description: "Provider ID" },
        caldav_url: { type: "string", description: "CalDAV calendar URL" },
        username: { type: "string", description: "CalDAV username" },
        password: { type: "string", description: "CalDAV password" },
      },
      required: ["provider_id", "caldav_url", "username", "password"],
    },
  },
  {
    name: "get_external_events",
    description: "Get events from synced external calendars for a provider and date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        provider_id: { type: "number", description: "Provider ID" },
        date_from: { type: "string", description: "Start date (ISO format)" },
        date_to: { type: "string", description: "End date (ISO format)" },
      },
      required: ["provider_id", "date_from", "date_to"],
    },
  },
];

// ── Tool Handlers ────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    // ════════════════════════════════════════════════
    // BOOKING
    // ════════════════════════════════════════════════

    case "get_available_slots": {
      const serviceResult = await query(
        "SELECT duration_minutes FROM services WHERE id = $1 AND active = true",
        [args.service_id]
      );
      if (serviceResult.rows.length === 0) {
        throw new Error(`Service ${args.service_id} not found or inactive.`);
      }
      const duration = serviceResult.rows[0].duration_minutes;

      const dateFrom = args.date_from;
      const dateTo = args.date_to || dateFrom;

      // Validate date range
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + ADVANCE_DAYS);
      if (to > maxDate) {
        throw new Error(`Cannot book more than ${ADVANCE_DAYS} days in advance.`);
      }

      // Determine which providers to check
      let providerIds: number[] = [];
      if (args.provider_id) {
        providerIds = [args.provider_id];
      } else {
        const provResult = await query(
          "SELECT id FROM providers WHERE active = true"
        );
        providerIds = provResult.rows.map((r: any) => r.id);
      }

      const result: Record<string, Record<string, { start: string; end: string }[]>> = {};
      const cursor = new Date(from);

      while (cursor <= to) {
        const dateStr = toISODate(cursor);
        result[dateStr] = {};

        for (const pid of providerIds) {
          const slots = await generateSlots(pid, dateStr, duration);
          if (slots.length > 0) {
            // Get provider name for display
            const provName = await query("SELECT name FROM providers WHERE id = $1", [pid]);
            const label = provName.rows[0]?.name || `Provider ${pid}`;
            result[dateStr][label] = slots;
          }
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      return JSON.stringify(result, null, 2);
    }

    case "book_appointment": {
      const serviceResult = await query(
        "SELECT id, duration_minutes, name, price FROM services WHERE id = $1 AND active = true",
        [args.service_id]
      );
      if (serviceResult.rows.length === 0) {
        throw new Error(`Service ${args.service_id} not found or inactive.`);
      }
      const service = serviceResult.rows[0];

      // Verify provider exists and is active
      const provResult = await query(
        "SELECT id, name FROM providers WHERE id = $1 AND active = true",
        [args.provider_id]
      );
      if (provResult.rows.length === 0) {
        throw new Error(`Provider ${args.provider_id} not found or inactive.`);
      }
      const provider = provResult.rows[0];

      const startTime = new Date(args.datetime);
      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

      // Check for conflicting appointments (with buffer)
      const conflictResult = await query(
        `SELECT id FROM appointments
         WHERE provider_id = $1
           AND status NOT IN ('cancelled')
           AND datetime < $3::timestamptz + interval '${BUFFER_MINUTES} minutes'
           AND end_time > $2::timestamptz - interval '${BUFFER_MINUTES} minutes'
         LIMIT 1`,
        [args.provider_id, startTime.toISOString(), endTime.toISOString()]
      );

      if (conflictResult.rows.length > 0) {
        throw new Error(
          "This time slot is no longer available. Another appointment conflicts with the requested time. " +
          "Please use get_available_slots to find open slots."
        );
      }

      // Check for external calendar conflicts
      const extConflict = await query(
        `SELECT id FROM external_events
         WHERE provider_id = $1
           AND start_time < $3::timestamptz
           AND end_time > $2::timestamptz
         LIMIT 1`,
        [args.provider_id, startTime.toISOString(), endTime.toISOString()]
      );

      if (extConflict.rows.length > 0) {
        throw new Error(
          "This time slot conflicts with an event on the provider's external calendar. " +
          "Please use get_available_slots to find open slots."
        );
      }

      // Insert the appointment
      const insertResult = await query(
        `INSERT INTO appointments
         (service_id, provider_id, customer_name, customer_phone, customer_email,
          datetime, end_time, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'booked', $8)
         RETURNING id, datetime, end_time, status, created_at`,
        [
          args.service_id,
          args.provider_id,
          args.customer_name,
          args.customer_phone,
          args.customer_email || null,
          startTime.toISOString(),
          endTime.toISOString(),
          args.notes || null,
        ]
      );

      const appt = insertResult.rows[0];

      return JSON.stringify(
        {
          appointment_id: appt.id,
          status: appt.status,
          service: service.name,
          provider: provider.name,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          datetime: appt.datetime,
          end_time: appt.end_time,
          duration_minutes: service.duration_minutes,
          price: parseFloat(service.price),
          notes: args.notes || null,
          created_at: appt.created_at,
        },
        null,
        2
      );
    }

    case "cancel_appointment": {
      const apptResult = await query(
        `SELECT id, datetime, status, customer_name, customer_phone
         FROM appointments WHERE id = $1`,
        [args.appointment_id]
      );
      if (apptResult.rows.length === 0) {
        throw new Error(`Appointment ${args.appointment_id} not found.`);
      }
      const appt = apptResult.rows[0];

      if (appt.status === "cancelled") {
        throw new Error("This appointment is already cancelled.");
      }
      if (appt.status === "completed") {
        throw new Error("Cannot cancel a completed appointment.");
      }

      // Check cancellation window
      const hoursUntil =
        (new Date(appt.datetime).getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntil < CANCELLATION_WINDOW_HOURS && !args.force) {
        throw new Error(
          `Cancellation policy requires ${CANCELLATION_WINDOW_HOURS}h notice. ` +
          `This appointment is in ${hoursUntil.toFixed(1)} hours. ` +
          `Use force=true to override (staff only).`
        );
      }

      await query(
        `UPDATE appointments
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancellation_reason = $2
         WHERE id = $1`,
        [args.appointment_id, args.reason || null]
      );

      return JSON.stringify({
        appointment_id: args.appointment_id,
        status: "cancelled",
        customer_name: appt.customer_name,
        was_within_policy_window: hoursUntil < CANCELLATION_WINDOW_HOURS,
        reason: args.reason || null,
      }, null, 2);
    }

    case "reschedule_appointment": {
      const apptResult = await query(
        `SELECT a.id, a.service_id, a.provider_id, a.datetime, a.status,
                a.customer_name, a.customer_phone, a.notes,
                s.duration_minutes, s.name as service_name,
                p.name as provider_name
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN providers p ON a.provider_id = p.id
         WHERE a.id = $1`,
        [args.appointment_id]
      );
      if (apptResult.rows.length === 0) {
        throw new Error(`Appointment ${args.appointment_id} not found.`);
      }
      const appt = apptResult.rows[0];

      if (appt.status === "cancelled" || appt.status === "completed") {
        throw new Error(`Cannot reschedule a ${appt.status} appointment.`);
      }

      const newStart = new Date(args.new_datetime);
      const newEnd = new Date(newStart.getTime() + appt.duration_minutes * 60000);

      // Check for conflicts at the new time (excluding this appointment)
      const conflictResult = await query(
        `SELECT id FROM appointments
         WHERE provider_id = $1
           AND id != $4
           AND status NOT IN ('cancelled')
           AND datetime < $3::timestamptz + interval '${BUFFER_MINUTES} minutes'
           AND end_time > $2::timestamptz - interval '${BUFFER_MINUTES} minutes'
         LIMIT 1`,
        [appt.provider_id, newStart.toISOString(), newEnd.toISOString(), args.appointment_id]
      );

      if (conflictResult.rows.length > 0) {
        throw new Error(
          "The new time slot is not available. Please use get_available_slots to find open slots."
        );
      }

      // Check external calendar conflicts
      const extConflict = await query(
        `SELECT id FROM external_events
         WHERE provider_id = $1
           AND start_time < $3::timestamptz
           AND end_time > $2::timestamptz
         LIMIT 1`,
        [appt.provider_id, newStart.toISOString(), newEnd.toISOString()]
      );

      if (extConflict.rows.length > 0) {
        throw new Error(
          "The new time slot conflicts with a provider's external calendar event."
        );
      }

      await query(
        `UPDATE appointments
         SET datetime = $2, end_time = $3,
             reminder_sent_24h = false, reminder_sent_2h = false
         WHERE id = $1`,
        [args.appointment_id, newStart.toISOString(), newEnd.toISOString()]
      );

      return JSON.stringify({
        appointment_id: args.appointment_id,
        status: "rescheduled",
        service: appt.service_name,
        provider: appt.provider_name,
        old_datetime: appt.datetime,
        new_datetime: newStart.toISOString(),
        new_end_time: newEnd.toISOString(),
        customer_name: appt.customer_name,
      }, null, 2);
    }

    case "get_appointment": {
      const result = await query(
        `SELECT a.*,
                s.name as service_name, s.duration_minutes, s.price,
                p.name as provider_name, p.phone as provider_phone
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN providers p ON a.provider_id = p.id
         WHERE a.id = $1`,
        [args.appointment_id]
      );
      if (result.rows.length === 0) {
        throw new Error(`Appointment ${args.appointment_id} not found.`);
      }
      return JSON.stringify(result.rows[0], null, 2);
    }

    case "list_appointments": {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (args.date_from) {
        conditions.push(`a.datetime >= $${paramIdx}::timestamptz`);
        params.push(args.date_from);
        paramIdx++;
      }
      if (args.date_to) {
        conditions.push(`a.datetime <= ($${paramIdx}::date + interval '1 day')`);
        params.push(args.date_to);
        paramIdx++;
      }
      if (args.provider_id) {
        conditions.push(`a.provider_id = $${paramIdx}`);
        params.push(args.provider_id);
        paramIdx++;
      }
      if (args.customer_phone) {
        conditions.push(`a.customer_phone = $${paramIdx}`);
        params.push(args.customer_phone);
        paramIdx++;
      }
      if (args.status) {
        conditions.push(`a.status = $${paramIdx}`);
        params.push(args.status);
        paramIdx++;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const limit = args.limit || 20;

      const result = await query(
        `SELECT a.id, a.customer_name, a.customer_phone, a.datetime, a.end_time,
                a.status, a.notes,
                s.name as service_name, s.price,
                p.name as provider_name
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN providers p ON a.provider_id = p.id
         ${where}
         ORDER BY a.datetime DESC
         LIMIT ${limit}`,
        params
      );

      return JSON.stringify({
        count: result.rows.length,
        appointments: result.rows,
      }, null, 2);
    }

    // ════════════════════════════════════════════════
    // SERVICES
    // ════════════════════════════════════════════════

    case "list_services": {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      if (args.active_only !== false) {
        conditions.push("active = true");
      }
      if (args.category) {
        conditions.push(`category = $${paramIdx}`);
        params.push(args.category);
        paramIdx++;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const result = await query(
        `SELECT id, name, duration_minutes, price, description, category, active
         FROM services ${where}
         ORDER BY category, name`,
        params
      );

      return JSON.stringify(result.rows, null, 2);
    }

    case "create_service": {
      const result = await query(
        `INSERT INTO services (name, duration_minutes, price, description, category)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [args.name, args.duration_minutes, args.price, args.description || null, args.category || null]
      );
      return JSON.stringify(result.rows[0], null, 2);
    }

    // ════════════════════════════════════════════════
    // PROVIDERS
    // ════════════════════════════════════════════════

    case "list_providers": {
      const where = args.active_only !== false ? "WHERE active = true" : "";
      const result = await query(
        `SELECT id, name, phone, email, specialties, active FROM providers ${where} ORDER BY name`
      );
      return JSON.stringify(result.rows, null, 2);
    }

    case "get_provider_schedule": {
      const dateFrom = args.date_from;
      const dateTo = args.date_to || dateFrom;

      // Get base working hours
      const schedResult = await query(
        `SELECT day_of_week, start_time, end_time, break_start, break_end
         FROM provider_schedules
         WHERE provider_id = $1
         ORDER BY day_of_week`,
        [args.provider_id]
      );

      // Get appointments in range
      const apptResult = await query(
        `SELECT a.id, a.datetime, a.end_time, a.status, a.customer_name,
                s.name as service_name
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.provider_id = $1
           AND a.datetime::date >= $2::date
           AND a.datetime::date <= $3::date
           AND a.status NOT IN ('cancelled')
         ORDER BY a.datetime`,
        [args.provider_id, dateFrom, dateTo]
      );

      // Get external events in range
      const extResult = await query(
        `SELECT title, start_time, end_time, all_day
         FROM external_events
         WHERE provider_id = $1
           AND start_time::date <= $3::date
           AND end_time::date >= $2::date
         ORDER BY start_time`,
        [args.provider_id, dateFrom, dateTo]
      );

      return JSON.stringify({
        provider_id: args.provider_id,
        date_range: { from: dateFrom, to: dateTo },
        working_hours: schedResult.rows,
        appointments: apptResult.rows,
        external_events: extResult.rows,
      }, null, 2);
    }

    case "set_working_hours": {
      const result = await query(
        `INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, break_start, break_end)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (provider_id, day_of_week)
         DO UPDATE SET start_time = $3, end_time = $4, break_start = $5, break_end = $6
         RETURNING *`,
        [
          args.provider_id,
          args.day_of_week,
          args.start_time,
          args.end_time,
          args.break_start || null,
          args.break_end || null,
        ]
      );
      return JSON.stringify(result.rows[0], null, 2);
    }

    // ════════════════════════════════════════════════
    // REMINDERS
    // ════════════════════════════════════════════════

    case "send_reminder": {
      const apptResult = await query(
        `SELECT a.id, a.customer_name, a.customer_phone, a.datetime, a.status,
                a.reminder_sent_24h, a.reminder_sent_2h,
                s.name as service_name, s.price,
                p.name as provider_name
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         JOIN providers p ON a.provider_id = p.id
         WHERE a.id = $1`,
        [args.appointment_id]
      );

      if (apptResult.rows.length === 0) {
        throw new Error(`Appointment ${args.appointment_id} not found.`);
      }

      const appt = apptResult.rows[0];

      if (appt.status === "cancelled") {
        throw new Error("Cannot send reminder for a cancelled appointment.");
      }

      if (!appt.customer_phone) {
        throw new Error("No phone number on file for this customer.");
      }

      // Check if already sent
      if (args.type === "24h" && appt.reminder_sent_24h) {
        return JSON.stringify({ status: "already_sent", type: "24h", appointment_id: appt.id });
      }
      if (args.type === "2h" && appt.reminder_sent_2h) {
        return JSON.stringify({ status: "already_sent", type: "2h", appointment_id: appt.id });
      }

      const apptDate = new Date(appt.datetime);
      const dateStr = apptDate.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: BUSINESS_TIMEZONE,
      });
      const timeStr = apptDate.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: BUSINESS_TIMEZONE,
      });

      let message: string;
      if (args.type === "24h") {
        message =
          `Hola ${appt.customer_name} 👋 Te recordamos tu cita mañana:\n` +
          `${appt.service_name} a las ${timeStr}\n` +
          `Con: ${appt.provider_name}\n\n` +
          `¿Todo confirmado? Responde 'Sí' para confirmar o 'Cambiar' si necesitas reprogramar.`;
      } else {
        message =
          `¡Hola! Tu cita es en 2 horas ⏰\n` +
          `${appt.service_name} a las ${timeStr}\n` +
          `Con: ${appt.provider_name}\n\n` +
          `¡Te esperamos!`;
      }

      const sent = await sendWhatsApp(appt.customer_phone, message);

      // Mark as sent
      const field = args.type === "24h" ? "reminder_sent_24h" : "reminder_sent_2h";
      await query(`UPDATE appointments SET ${field} = true WHERE id = $1`, [appt.id]);

      return JSON.stringify({
        status: sent ? "sent" : "queued_no_api",
        type: args.type,
        appointment_id: appt.id,
        customer_phone: appt.customer_phone,
        message,
      }, null, 2);
    }

    case "list_no_shows": {
      const daysBack = args.days_back || 30;
      const minNoShows = args.min_no_shows || 1;

      const result = await query(
        `SELECT customer_name, customer_phone,
                COUNT(*) as no_show_count,
                MAX(datetime) as last_no_show,
                array_agg(id ORDER BY datetime DESC) as appointment_ids
         FROM appointments
         WHERE status = 'no_show'
           AND datetime >= NOW() - interval '${daysBack} days'
         GROUP BY customer_name, customer_phone
         HAVING COUNT(*) >= $1
         ORDER BY no_show_count DESC`,
        [minNoShows]
      );

      return JSON.stringify({
        period_days: daysBack,
        customers: result.rows,
      }, null, 2);
    }

    // ════════════════════════════════════════════════
    // CALENDAR SYNC
    // ════════════════════════════════════════════════

    case "sync_google_calendar": {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
      const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error(
          "Google Calendar integration not configured. " +
          "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI env vars."
        );
      }

      // Check if we already have a sync record for this provider
      const existingSync = await query(
        `SELECT id, credentials_encrypted, last_sync
         FROM calendar_syncs
         WHERE provider_id = $1 AND type = 'google' AND sync_enabled = true
         LIMIT 1`,
        [args.provider_id]
      );

      if (!args.auth_code && existingSync.rows.length === 0) {
        // First time: return OAuth2 authorization URL
        const scopes = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly");
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
          `response_type=code&` +
          `scope=${scopes}&` +
          `access_type=offline&` +
          `state=provider_${args.provider_id}`;

        return JSON.stringify({
          status: "auth_required",
          authorization_url: authUrl,
          instructions: "Open this URL in a browser, authorize access, then call this tool again with the auth_code parameter.",
        }, null, 2);
      }

      if (args.auth_code) {
        // Exchange auth code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: args.auth_code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          throw new Error(`Google OAuth2 token exchange failed: ${err}`);
        }

        const tokens = await tokenRes.json() as Record<string, any>;

        // Store sync record (credentials stored as JSON — in production, encrypt these)
        await query(
          `INSERT INTO calendar_syncs (provider_id, type, credentials_encrypted, last_sync)
           VALUES ($1, 'google', $2, NOW())
           ON CONFLICT DO NOTHING`,
          [args.provider_id, JSON.stringify(tokens)]
        );
      }

      // Fetch events from Google Calendar
      const syncRecord = args.auth_code
        ? (await query(
            "SELECT id, credentials_encrypted FROM calendar_syncs WHERE provider_id = $1 AND type = 'google' ORDER BY id DESC LIMIT 1",
            [args.provider_id]
          )).rows[0]
        : existingSync.rows[0];

      if (!syncRecord?.credentials_encrypted) {
        throw new Error("No valid Google Calendar credentials found for this provider.");
      }

      const creds = JSON.parse(syncRecord.credentials_encrypted);
      const now = new Date();
      const timeMin = now.toISOString();
      const futureDate = new Date(now.getTime() + ADVANCE_DAYS * 24 * 60 * 60 * 1000);
      const timeMax = futureDate.toISOString();

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${creds.access_token}` },
        }
      );

      if (!calRes.ok) {
        const errText = await calRes.text();
        throw new Error(`Google Calendar API error: ${errText}`);
      }

      const calData = await calRes.json() as Record<string, any>;
      const events: any[] = calData.items || [];
      let synced = 0;

      for (const event of events) {
        const startTime = event.start?.dateTime || event.start?.date;
        const endTime = event.end?.dateTime || event.end?.date;
        const allDay = !event.start?.dateTime;

        if (!startTime || !endTime) continue;

        await query(
          `INSERT INTO external_events (calendar_sync_id, provider_id, external_id, title, start_time, end_time, all_day, last_updated)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT DO NOTHING`,
          [syncRecord.id, args.provider_id, event.id, event.summary || "Busy", startTime, endTime, allDay]
        );
        synced++;
      }

      // Update last sync time
      await query("UPDATE calendar_syncs SET last_sync = NOW() WHERE id = $1", [syncRecord.id]);

      return JSON.stringify({
        status: "synced",
        provider_id: args.provider_id,
        events_synced: synced,
        sync_range: { from: timeMin, to: timeMax },
      }, null, 2);
    }

    case "sync_caldav": {
      // Store CalDAV credentials
      const credentials = JSON.stringify({
        url: args.caldav_url,
        username: args.username,
        password: args.password,
      });

      const syncResult = await query(
        `INSERT INTO calendar_syncs (provider_id, type, credentials_encrypted, calendar_url, last_sync)
         VALUES ($1, 'caldav', $2, $3, NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [args.provider_id, credentials, args.caldav_url]
      );

      let syncId: number;
      if (syncResult.rows.length > 0) {
        syncId = syncResult.rows[0].id;
      } else {
        // Already exists, get the id and update credentials
        const existing = await query(
          "SELECT id FROM calendar_syncs WHERE provider_id = $1 AND type = 'caldav' AND calendar_url = $2",
          [args.provider_id, args.caldav_url]
        );
        syncId = existing.rows[0].id;
        await query(
          "UPDATE calendar_syncs SET credentials_encrypted = $1, last_sync = NOW() WHERE id = $2",
          [credentials, syncId]
        );
      }

      // Fetch CalDAV events via REPORT request
      const now = new Date();
      const futureDate = new Date(now.getTime() + ADVANCE_DAYS * 24 * 60 * 60 * 1000);

      const calendarQuery = `<?xml version="1.0" encoding="UTF-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${now.toISOString().replace(/[-:]/g, "").split(".")[0]}Z"
                      end="${futureDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

      try {
        const caldavRes = await fetch(args.caldav_url, {
          method: "REPORT",
          headers: {
            "Content-Type": "application/xml",
            Depth: "1",
            Authorization: "Basic " + Buffer.from(`${args.username}:${args.password}`).toString("base64"),
          },
          body: calendarQuery,
        });

        if (!caldavRes.ok) {
          const errText = await caldavRes.text();
          throw new Error(`CalDAV REPORT failed (${caldavRes.status}): ${errText}`);
        }

        const responseText = await caldavRes.text();

        // Parse iCalendar VEVENT blocks from the response
        const eventBlocks = responseText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
        let synced = 0;

        for (const block of eventBlocks) {
          const uid = block.match(/UID:(.*)/)?.[1]?.trim() || `caldav_${Date.now()}_${synced}`;
          const summary = block.match(/SUMMARY:(.*)/)?.[1]?.trim() || "Busy";
          const dtstart = block.match(/DTSTART[^:]*:(.*)/)?.[1]?.trim();
          const dtend = block.match(/DTEND[^:]*:(.*)/)?.[1]?.trim();

          if (!dtstart || !dtend) continue;

          // Parse iCal date format (basic: 20260321T150000Z or 20260321)
          const parseICalDate = (s: string): string => {
            if (s.length === 8) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
            const d = s.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6");
            return d.endsWith("Z") ? d : d + "Z";
          };

          const allDay = dtstart.length === 8;

          await query(
            `INSERT INTO external_events (calendar_sync_id, provider_id, external_id, title, start_time, end_time, all_day, last_updated)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT DO NOTHING`,
            [syncId, args.provider_id, uid, summary, parseICalDate(dtstart), parseICalDate(dtend), allDay]
          );
          synced++;
        }

        await query("UPDATE calendar_syncs SET last_sync = NOW() WHERE id = $1", [syncId]);

        return JSON.stringify({
          status: "synced",
          provider_id: args.provider_id,
          caldav_url: args.caldav_url,
          events_synced: synced,
        }, null, 2);
      } catch (err: any) {
        // If CalDAV fetch fails, we still saved the credentials for future syncs
        return JSON.stringify({
          status: "credentials_saved",
          provider_id: args.provider_id,
          caldav_url: args.caldav_url,
          error: err.message,
          note: "Credentials saved. Events will sync on next successful connection.",
        }, null, 2);
      }
    }

    case "get_external_events": {
      const result = await query(
        `SELECT ee.id, ee.title, ee.start_time, ee.end_time, ee.all_day,
                cs.type as calendar_type, cs.calendar_url
         FROM external_events ee
         JOIN calendar_syncs cs ON ee.calendar_sync_id = cs.id
         WHERE ee.provider_id = $1
           AND ee.start_time::date <= $3::date
           AND ee.end_time::date >= $2::date
         ORDER BY ee.start_time`,
        [args.provider_id, args.date_from, args.date_to]
      );

      return JSON.stringify({
        provider_id: args.provider_id,
        date_range: { from: args.date_from, to: args.date_to },
        events: result.rows,
      }, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ─────────────────────────────────

const server = new Server(
  { name: "appointments-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return { content: [{ type: "text", text: result }] };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ── Start ────────────────────────────────────────────

async function main() {
  await ensureSchema();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Appointments MCP server running on stdio");
}

main().catch(console.error);
