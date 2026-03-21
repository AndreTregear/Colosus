# Appointments System Guide

Complete guide for the yaya-appointments system: a standalone-but-integratable appointment booking MCP server with WhatsApp reminders and calendar sync.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    yaya-appointments                     │
│                    (SKILL.md Agent)                       │
│  Natural language → MCP tool calls → WhatsApp responses  │
└──────────────────────┬──────────────────────────────────┘
                       │ MCP Protocol (stdio)
┌──────────────────────▼──────────────────────────────────┐
│              appointments-mcp Server                     │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Booking  │ │ Services │ │Providers │ │  Calendar  │ │
│  │  Tools   │ │  Tools   │ │  Tools   │ │  Sync      │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │            │            │              │         │
│  ┌────▼────────────▼────────────▼──────────────▼──────┐ │
│  │                PostgreSQL Database                  │ │
│  │  services │ providers │ appointments │ calendar_*   │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│  ┌───────────────────────▼────────────────────────────┐ │
│  │              External Integrations                  │ │
│  │  Google Calendar │ CalDAV │ WhatsApp Business API   │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Data Model

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  services   │     │   appointments   │     │  providers  │
├─────────────┤     ├──────────────────┤     ├─────────────┤
│ id (PK)     │◄──┐ │ id (PK)          │ ┌──►│ id (PK)     │
│ name        │   └─│ service_id (FK)  │ │   │ name        │
│ duration_min│     │ provider_id (FK)─┼─┘   │ phone       │
│ price       │     │ customer_name    │     │ email       │
│ description │     │ customer_phone   │     │ specialties │
│ category    │     │ customer_email   │     │ active      │
│ active      │     │ datetime         │     └──────┬──────┘
└─────────────┘     │ end_time         │            │
                    │ status           │            │
                    │ notes            │     ┌──────▼──────────────┐
                    │ reminder_sent_*  │     │ provider_schedules  │
                    │ created_at       │     ├─────────────────────┤
                    │ cancelled_at     │     │ id (PK)             │
                    └──────────────────┘     │ provider_id (FK)    │
                                            │ day_of_week (0-6)   │
┌──────────────────┐     ┌────────────────┐ │ start_time          │
│  calendar_syncs  │     │ external_events│ │ end_time            │
├──────────────────┤     ├────────────────┤ │ break_start         │
│ id (PK)          │◄──┐ │ id (PK)        │ │ break_end           │
│ provider_id (FK) │   └─│ cal_sync_id(FK)│ └─────────────────────┘
│ type             │     │ provider_id(FK)│
│ credentials_enc  │     │ external_id    │
│ calendar_url     │     │ title          │
│ last_sync        │     │ start_time     │
│ sync_enabled     │     │ end_time       │
└──────────────────┘     │ all_day        │
                         └────────────────┘

Appointment statuses: booked → confirmed → completed
                      booked → cancelled
                      booked → confirmed → no_show
```

## 1. Standalone Setup (Postgres Only)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Installation

```bash
cd mcp-servers/appointments-mcp
npm install
```

### Database Setup

The MCP server auto-creates tables on startup. Just provide a connection string:

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE appointments;"

# Set the connection string
export APPOINTMENTS_DATABASE_URL="postgresql://postgres:password@localhost:5432/appointments"
```

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required
APPOINTMENTS_DATABASE_URL=postgresql://localhost:5432/appointments

# Scheduling defaults
APPOINTMENT_BUFFER=10               # Minutes between appointments
APPOINTMENT_ADVANCE_DAYS=30         # How far ahead customers can book
CANCELLATION_WINDOW_HOURS=24        # Free cancellation window
BUSINESS_TIMEZONE=America/Lima      # All times displayed in this timezone

# WhatsApp reminders (optional — works without these, just logs messages)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages
WHATSAPP_API_TOKEN=your_whatsapp_token

# Google Calendar sync (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

### Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Register in docker-compose

Add to your `docker-compose.yaml`:

```yaml
appointments-mcp:
  build: ./mcp-servers/appointments-mcp
  environment:
    - APPOINTMENTS_DATABASE_URL=postgresql://postgres:password@db:5432/appointments
    - BUSINESS_TIMEZONE=America/Lima
    - APPOINTMENT_BUFFER=10
  depends_on:
    - db
```

## 2. Google Calendar Integration

### Step 1: Create OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `https://your-domain.com/auth/google/callback`
7. Copy Client ID and Client Secret

### Step 2: Configure Environment

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="https://your-domain.com/auth/google/callback"
```

### Step 3: Initiate Sync for a Provider

Call the `sync_google_calendar` tool with just the provider_id:

```json
{
  "provider_id": 1
}
```

This returns an OAuth2 authorization URL. The provider opens this URL, authorizes access, and gets redirected back with an authorization code.

### Step 4: Complete Authorization

Call the tool again with the auth code:

```json
{
  "provider_id": 1,
  "auth_code": "4/0AX4XfWh..."
}
```

This exchanges the code for tokens, stores them, and performs the initial sync.

### Step 5: Ongoing Sync

Subsequent calls to `sync_google_calendar` with just the provider_id will refresh events using the stored tokens. Set up a cron job or periodic task:

```bash
# Sync every 15 minutes via cron
*/15 * * * * curl -X POST http://localhost:3000/sync-calendars
```

### How It Works

- Google Calendar events are fetched for the next `APPOINTMENT_ADVANCE_DAYS` days
- Events are stored in the `external_events` table
- When `get_available_slots` runs, it checks both `appointments` AND `external_events`
- If a provider has a meeting on Google Calendar, that time is blocked for appointment booking
- All-day events block the entire working day

## 3. CalDAV Integration (Nextcloud, Radicale, Apple Calendar)

### Nextcloud

```json
{
  "provider_id": 1,
  "caldav_url": "https://nextcloud.example.com/remote.php/dav/calendars/username/personal/",
  "username": "username",
  "password": "app-password"
}
```

Generate an app password in Nextcloud: **Settings** → **Security** → **Devices & sessions** → **Create new app password**.

### Radicale

```json
{
  "provider_id": 2,
  "caldav_url": "https://radicale.example.com/user/calendar.ics/",
  "username": "user",
  "password": "password"
}
```

### Apple Calendar (via iCloud CalDAV)

```json
{
  "provider_id": 3,
  "caldav_url": "https://caldav.icloud.com/USER_ID/calendars/CALENDAR_ID/",
  "username": "apple-id@icloud.com",
  "password": "app-specific-password"
}
```

Generate an app-specific password at [appleid.apple.com](https://appleid.apple.com/) → **Sign-In and Security** → **App-Specific Passwords**.

### How CalDAV Sync Works

1. Credentials are stored in `calendar_syncs` table
2. A CalDAV `REPORT` request fetches VEVENT data for the configured date range
3. Events are parsed from iCalendar format and stored in `external_events`
4. These events block appointment slots just like Google Calendar events
5. Re-running `sync_caldav` refreshes the events

## 4. WhatsApp Reminder Configuration

### Using Meta WhatsApp Business API

1. Set up a [Meta Business account](https://business.facebook.com/)
2. Create a WhatsApp Business App in Meta Developer portal
3. Get your Phone Number ID and permanent token

```bash
export WHATSAPP_API_URL="https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages"
export WHATSAPP_API_TOKEN="your_permanent_token"
```

### Reminder Flow

The system sends two reminders per appointment:

| Reminder | When | Purpose |
|----------|------|---------|
| 24h | Day before | Allows customer to confirm or reschedule |
| 2h | Same day | Final reminder before appointment |

Use the `send_reminder` tool:

```json
{
  "appointment_id": 127,
  "type": "24h"
}
```

### Automated Reminders

To automate reminders, set up a periodic job that:
1. Queries appointments in the next 24h/2h that haven't been reminded
2. Calls `send_reminder` for each

Example cron approach:
```bash
# Run every hour
0 * * * * /path/to/reminder-check.sh
```

### Without WhatsApp API

If `WHATSAPP_API_URL` is not configured, reminders are logged to stderr instead of sent. The `send_reminder` tool still marks the appointment as reminded and returns the message text — useful for manual sending or other channels.

## 5. API Reference

### Booking Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_available_slots` | Find open time slots | `service_id`, `date_from` |
| `book_appointment` | Book a slot | `customer_name`, `customer_phone`, `service_id`, `provider_id`, `datetime` |
| `cancel_appointment` | Cancel by ID | `appointment_id` |
| `reschedule_appointment` | Move to new time | `appointment_id`, `new_datetime` |
| `get_appointment` | Get appointment details | `appointment_id` |
| `list_appointments` | List with filters | (all optional filters) |

### Service Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `list_services` | List service catalog | (none) |
| `create_service` | Add new service | `name`, `duration_minutes`, `price` |

### Provider Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `list_providers` | List staff/providers | (none) |
| `get_provider_schedule` | Working hours + bookings | `provider_id`, `date_from` |
| `set_working_hours` | Set daily schedule | `provider_id`, `day_of_week`, `start_time`, `end_time` |

### Reminder Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `send_reminder` | Send WhatsApp reminder | `appointment_id`, `type` |
| `list_no_shows` | Find no-show customers | (none) |

### Calendar Sync Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `sync_google_calendar` | Google Calendar OAuth + sync | `provider_id` |
| `sync_caldav` | CalDAV server sync | `provider_id`, `caldav_url`, `username`, `password` |
| `get_external_events` | View synced external events | `provider_id`, `date_from`, `date_to` |

## 6. Quick Start Example

Set up a dental clinic with two providers:

```bash
# 1. Start the server
export APPOINTMENTS_DATABASE_URL="postgresql://localhost:5432/appointments"
npm run dev

# 2. Create services (via MCP tool calls)
# create_service: { name: "Limpieza básica", duration_minutes: 30, price: 80, category: "Limpieza" }
# create_service: { name: "Limpieza profunda", duration_minutes: 60, price: 150, category: "Limpieza" }
# create_service: { name: "Revisión general", duration_minutes: 20, price: 50, category: "Consulta" }

# 3. Working hours are set via set_working_hours tool:
# Mon-Fri 9:00-13:00 and 14:00-18:00 (break 13:00-14:00)
# Saturday 9:00-13:00

# 4. Optional: sync a provider's Google Calendar
# sync_google_calendar: { provider_id: 1 }
# → Follow OAuth flow
```

## 7. Troubleshooting

### "Service not found or inactive"
The service_id doesn't exist or `active = false`. Check with `list_services` (set `active_only: false` to see all).

### "No available slots"
- Provider may not have working hours set for that day → use `set_working_hours`
- All slots may be booked → try a different date or provider
- External calendar may be blocking → check with `get_external_events`

### "Google Calendar API error"
- Token may have expired → call `sync_google_calendar` again to re-authorize
- API may not be enabled → verify Google Calendar API is enabled in Cloud Console

### "CalDAV REPORT failed"
- Check URL format — must end with `/` for most CalDAV servers
- Verify credentials (use app-specific password, not main password)
- Nextcloud: use `remote.php/dav/calendars/USERNAME/CALENDAR/`

### WhatsApp reminders not sending
- If `WHATSAPP_API_URL` is not set, messages are logged only
- Check that the phone number format includes country code (e.g., `+51999888777`)
- Verify your WhatsApp Business API token hasn't expired
