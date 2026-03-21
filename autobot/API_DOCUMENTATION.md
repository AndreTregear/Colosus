# Yaya API Documentation - Frontend Team

## Overview

This document describes the new Yaya API endpoints for the 5 product-defining features. All endpoints require authentication via `requireMobileOrDeviceAuth` middleware.

**Base URL**: `/api/v1/mobile`

**Authentication**: Bearer token in Authorization header

---

## Feature 1: 3-Minute Onboarding (Voice/Photo Product Extraction)

### Extract Products from Voice/Text

**POST** `/products/extract/from-voice`

Extract product information from voice recording or text description. Supports multi-turn conversation for clarification.

#### Request

**Content-Type**: `multipart/form-data` OR `application/json`

**Parameters**:
- `audio` (File, optional) - Audio file (ogg, mp3, m4a)
- `text` (string, optional) - Text description if no audio
- `sessionId` (string, optional) - Previous session ID for continuation
- `confirmedProducts` (array, optional) - Products to save (final step)

#### Flow Example

**Step 1**: Merchant sends voice
```bash
curl -X POST https://api.yaya.app/api/v1/mobile/products/extract/from-voice \
  -H "Authorization: Bearer {token}" \
  -F "audio=@empanadas.m4a"
```

**Response** (needs clarification):
```json
{
  "status": "needs_clarification",
  "transcription": "empanadas",
  "clarifyingQuestion": "¿De qué sabor? Tenemos pollo, carne, queso... ¿y a qué precio?",
  "missingFields": ["variants", "price"],
  "sessionId": "1645567890123-abc123"
}
```

**Step 2**: Merchant provides more details
```bash
curl -X POST https://api.yaya.app/api/v1/mobile/products/extract/from-voice \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "de pollo, carne y queso, todas a 3 soles",
    "sessionId": "1645567890123-abc123"
  }'
```

**Response** (complete):
```json
{
  "status": "complete",
  "transcription": "de pollo, carne y queso, todas a 3 soles",
  "products": [
    {
      "name": "Empanada de pollo",
      "price": 3,
      "category": "Empanadas",
      "variants": []
    },
    {
      "name": "Empanada de carne", 
      "price": 3,
      "category": "Empanadas",
      "variants": []
    },
    {
      "name": "Empanada de queso",
      "price": 3, 
      "category": "Empanadas",
      "variants": []
    }
  ],
  "sessionId": "1645567890123-abc123"
}
```

**Step 3**: Merchant confirms and saves
```bash
curl -X POST https://api.yaya.app/api/v1/mobile/products/extract/from-voice \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "1645567890123-abc123",
    "confirmedProducts": [
      {"name": "Empanada de pollo", "price": 3, "category": "Empanadas"},
      {"name": "Empanada de carne", "price": 3, "category": "Empanadas"}
    ]
  }'
```

**Response**:
```json
{
  "status": "complete",
  "sessionId": "1645567890123-abc123",
  "createdCount": 2,
  "products": [
    {"id": 123, "name": "Empanada de pollo", "price": 3, ...},
    {"id": 124, "name": "Empanada de carne", "price": 3, ...}
  ]
}
```

---

### Extract Products from Photo

**POST** `/products/extract/from-photo`

Extract product information from product photo with optional description.

#### Request

**Content-Type**: `multipart/form-data`

**Parameters**:
- `image` (File, required) - Product photo (jpeg, png, webp)
- `description` (string, optional) - Additional text description

#### Example

```bash
curl -X POST https://api.yaya.app/api/v1/mobile/products/extract/from-photo \
  -H "Authorization: Bearer {token}" \
  -F "image=@hamburguesa.jpg" \
  -F "description=hamburguesa con queso"
```

**Response** (complete):
```json
{
  "status": "complete",
  "products": [
    {
      "name": "Hamburguesa con queso",
      "price": 8.5,
      "description": "Hamburguesa de res con queso cheddar",
      "category": "Hamburguesas"
    }
  ],
  "confidence": "high"
}
```

**Response** (needs clarification):
```json
{
  "status": "needs_clarification",
  "clarifyingQuestion": "¿Qué toppings incluye? ¿Papas fritas o al hilo? ¿Y a qué precio?",
  "confidence": "medium",
  "products": [
    {
      "name": "Hamburguesa",
      "price": 0
    }
  ]
}
```

---

## Feature 2: Daily Smart Summary (Configurable Notifications)

### Get Notification Settings

**GET** `/notifications/settings`

Retrieve current daily summary notification settings.

#### Response

```json
{
  "enabled": true,
  "time": "06:00",
  "timezone": "America/Lima",
  "lastSent": "2024-01-15T06:00:00Z"
}
```

---

### Update Notification Settings

**POST** `/notifications/settings`

Configure daily summary notification time and preferences.

#### Request

```json
{
  "enabled": true,
  "time": "07:30",
  "timezone": "America/Lima"
}
```

**Time format**: `HH:mm` (24-hour)

**Supported timezones**: 
- `America/Lima` (Peru)
- `America/Bogota` (Colombia)
- `America/Mexico_City` (Mexico)
- `America/Santiago` (Chile)
- `America/Argentina/Buenos_Aires` (Argentina)
- etc.

#### Response

```json
{
  "ok": true
}
```

---

### Push Notification Payload

When daily summary is ready, backend emits push notification:

```json
{
  "title": "📊 Resumen de hoy — Empanadas María",
  "body": "Hoy tienes 23 pedidos por S/. 460. ¡3 clientes nuevos! 🎉",
  "data": {
    "type": "daily-summary",
    "summary": {
      "orders": {
        "total": 23,
        "byStatus": { "confirmed": 15, "pending": 8 },
        "revenue": 460
      },
      "customers": {
        "newToday": 3,
        "total": 156
      },
      "stock": {
        "lowStock": [{ "name": "Empanada espinaca", "stock": 2 }]
      }
    }
  }
}
```

---

## Feature 3: Smart Escalation (Conciliation-First)

### Escalation Flow

The escalation system is automatic. No API calls required from frontend.

**How it works**:
1. AI detects frustration/uncertainty in conversation
2. AI sends conciliation message first
3. If customer still frustrated → Escalates automatically
4. Push notification sent to merchant: "Te necesitan"

### Current Escalation Status

**GET** `/conversations/:jid/messages`

The existing endpoint now includes `aiPaused` and `escalationReason`:

```json
{
  "messages": [...],
  "total": 45,
  "customerName": "Rosita",
  "aiPaused": true,
  "escalationReason": "explicit_request"
}
```

**Escalation Reasons**:
- `explicit_request` - Customer asked for human
- `repeated_failure` - AI couldn't help after 2+ attempts
- `persistent_negative` - Customer remained frustrated
- `out_of_scope` - Request outside business scope
- `high_risk` - Sensitive topic (complaint, etc.)

---

### Manual AI Toggle (Existing)

**POST** `/conversations/:jid/pause-ai`

Manually pause/resume AI for a conversation.

#### Request

```json
{
  "paused": true
}
```

---

## Feature 4: Google Calendar Sync (One-Way)

### Get Auth URL

**GET** `/calendar/auth-url`

Get Google OAuth URL for calendar connection.

#### Response

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/auth?..."
}
```

**Frontend Action**: Open this URL in browser/webview for user to authorize

---

### OAuth Callback

**POST** `/calendar/callback`

Handle OAuth callback after user authorizes.

#### Request

```json
{
  "code": "4/0AX4XfWg..."
}
```

#### Response

```json
{
  "success": true,
  "connected": true
}
```

---

### Check Connection Status

**GET** `/calendar/status`

Check if Google Calendar is connected.

#### Response

```json
{
  "connected": true,
  "email": "maria.empanadas@gmail.com"
}
```

---

### Disconnect Calendar

**POST** `/calendar/disconnect`

Disconnect Google Calendar and remove stored tokens.

#### Response

```json
{
  "success": true
}
```

---

### Get Upcoming Events

**GET** `/calendar/events?days=7&maxResults=50`

Fetch upcoming calendar events.

**Query Parameters**:
- `days` (number, default: 7) - Days to look ahead (max: 30)
- `maxResults` (number, default: 50) - Max events (max: 100)

#### Response

```json
{
  "events": [
    {
      "id": "abc123event",
      "title": "Cita - María González",
      "start": "2024-01-16T14:00:00Z",
      "end": "2024-01-16T14:30:00Z",
      "description": "Limpieza dental + revisión",
      "location": "Consultorio Principal",
      "link": "https://calendar.google.com/..."
    }
  ]
}
```

---

### Sync Appointment to Calendar

**POST** `/calendar/sync-appointment`

Create an event in Google Calendar from a Yaya appointment.

#### Request

```json
{
  "title": "Cita - Ana López",
  "startTime": "2024-01-16T14:00:00Z",
  "endTime": "2024-01-16T14:30:00Z",
  "description": "Blanqueamiento dental",
  "customerEmail": "ana@email.com",
  "location": "Consultorio Principal"
}
```

#### Response

```json
{
  "success": true,
  "eventId": "abc123event",
  "eventLink": "https://calendar.google.com/event?eid=..."
}
```

---

### Delete Calendar Event

**DELETE** `/calendar/events/:eventId`

Remove an event from Google Calendar.

#### Response

```json
{
  "success": true
}
```

---

## Feature 5: Automated Follow-up Flows

### Get Flow Configurations

**GET** `/followup-flows`

Retrieve all follow-up flow configurations for the tenant.

#### Response

```json
[
  {
    "type": "post_purchase",
    "trigger": "order_delivered",
    "delayHours": 24,
    "templateKey": "post-purchase",
    "enabled": true
  },
  {
    "type": "abandoned_cart",
    "trigger": "order_pending",
    "delayHours": 4,
    "templateKey": "abandoned-cart",
    "enabled": true
  },
  {
    "type": "no_show",
    "trigger": "appointment_missed",
    "delayHours": 1,
    "templateKey": "no-show",
    "enabled": true
  },
  {
    "type": "re_engagement",
    "trigger": "customer_inactive",
    "delayHours": 720,
    "templateKey": "re-engagement",
    "enabled": false
  },
  {
    "type": "payment_reminder",
    "trigger": "payment_pending",
    "delayHours": 3,
    "templateKey": "payment-followup",
    "enabled": true
  }
]
```

---

### Toggle Flow

**POST** `/followup-flows/:type/toggle`

Enable or disable a specific follow-up flow.

**URL Parameters**:
- `type` - Flow type: `post_purchase`, `abandoned_cart`, `no_show`, `re_engagement`, `payment_reminder`

#### Request

```json
{
  "enabled": false
}
```

#### Response

```json
{
  "ok": true
}
```

---

## Message Templates Reference

### Post-Purchase Follow-up

**Trigger**: 24 hours after order delivery  
**Message** (Spanish):
```
¡Hola {customerName}! 🎉 ¿Todo bien con tu pedido #{orderId}? 
Esperamos que te haya encantado. Responde REPETIR si quieres 
pedir lo mismo otra vez. ¡Gracias por confiar en nosotros!
```

---

### Abandoned Cart

**Trigger**: 4 hours after pending order  
**Message** (Spanish):
```
¡Hola! 👋 Veo que dejaste un pedido pendiente (#{orderId}) por {total}. 
¿Te quedaste con las ganas? Responde SI y te ayudo a completarlo. 
¡Estoy aquí para lo que necesites!
```

---

### No-Show

**Trigger**: 1 hour after missed appointment  
**Message** (Spanish):
```
¡Hola {customerName}! 😊 Te extrañamos hoy en tu cita para "{serviceName}". 
¿Todo bien? Si quieres reagendar, responde CITA y buscamos otro momento. 
¡Te esperamos!
```

---

### Re-engagement

**Trigger**: 30 days of customer inactivity  
**Message** (Spanish):
```
¡Hola! 👋 Te extrañamos por aquí. ¿Cómo estás? Tenemos novedades que 
te pueden interesar. Responde VER y te cuento qué hay de nuevo. 
¡Será un gusto atenderte de nuevo!
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid request parameters"
}
```

**401 Unauthorized**:
```json
{
  "error": "Authentication required"
}
```

**404 Not Found**:
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

---

## Implementation Checklist for Frontend

### Feature 1: 3-Minute Onboarding
- [ ] Voice recording UI with waveform visualization
- [ ] Camera integration for product photos
- [ ] Multi-turn conversation UI for clarifying questions
- [ ] Product preview before saving
- [ ] Batch save multiple products

### Feature 2: Daily Summary
- [ ] Time picker for notification schedule
- [ ] Timezone selector (auto-detect + manual override)
- [ ] Enable/disable toggle
- [ ] Push notification handling with deep links

### Feature 3: Smart Escalation
- [ ] Escalation notification UI (banner/badge)
- [ ] "Tomar conversación" button
- [ ] Escalation reason display
- [ ] AI toggle switch in conversation view

### Feature 4: Google Calendar
- [ ] "Conectar Google Calendar" button
- [ ] OAuth webview/browser flow
- [ ] Calendar events list view
- [ ] Sync appointment toggle

### Feature 5: Follow-up Flows
- [ ] Flow configuration screen
- [ ] Toggle switches for each flow type
- [ ] Message preview
- [ ] Enable/disable all toggle

---

## Environment Configuration

### Required Environment Variables

```bash
# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://api.yaya.app/api/calendar/callback

# AI Services (existing)
AI_API_KEY=your_key
AI_BASE_URL=https://api.openai.com/v1
WHISPER_API_KEY=your_key
VISION_API_KEY=your_key

# Push Notifications
FCM_SERVER_KEY=your_fcm_key
```

---

## Questions?

Contact the backend team or check the implementation:
- Product extraction: `src/ai/product-extraction.ts`
- Daily summary: `src/queue/daily-summary-scheduler.ts`
- Escalation: `src/ai/escalation-detector.ts`
- Calendar: `src/integrations/google-calendar.ts`
- Follow-ups: `src/queue/followup-scheduler.ts`
