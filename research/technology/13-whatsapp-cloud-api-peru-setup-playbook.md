# WhatsApp Cloud API Setup Playbook for Peru

**Date:** March 21, 2026  
**Category:** Technology / Implementation  
**Research Cycle:** #14  
**Sources:** Meta Business Help Center, Aurora Inbox Peru guide (March 2026), CRMWhata Peru API guide (March 2026), GuruSup setup guide (March 2026), WhatsApp Cloud API documentation, Peru-specific BSP documentation  

---

## 1. Executive Summary

This document is the tactical playbook for setting up the WhatsApp Cloud API for Yaya Platform in Peru. It covers every step from Meta Business Account creation through webhook configuration, with Peru-specific requirements (RUC verification, SUNAT documentation, local payment methods). This is the Week 1 blocking task — nothing else in the 12-week plan can proceed without a functioning WhatsApp webhook.

**Timeline:** 3-7 business days for full setup (can be as fast as 1-2 days if verification is expedited)  
**Cost:** $0 for Cloud API access; $0 for service conversations  
**Risk:** Business verification rejection (mitigated by proper document preparation)  

---

## 2. Prerequisites Checklist — Peru-Specific

### 2.1 Required Documents

| Document | Peru Equivalent | Where to Get It | Notes |
|---|---|---|---|
| Business registration | **Ficha RUC** (SUNAT) | sunat.gob.pe/sol | Must be active (habido), not suspended |
| Legal entity proof | **Escritura Pública** or **Partida Registral** (SUNARP) | SUNARP offices or online | For companies; for persona natural, DNI + RUC suffices |
| Address verification | **Recibo de servicios** (utility bill) | Any utility provider | Must match RUC address; less than 12 months old |
| Tax document | **Constancia de RUC** | SUNAT SOL portal | Free, downloadable |
| Representative ID | **DNI** or **Carnet de Extranjería** | RENIEC | Must match RUC representative |

### 2.2 Technical Requirements

- **Dedicated phone number:** Must NOT be registered on WhatsApp or WhatsApp Business app. Can be a new SIM card (Entel, Claro, Movistar, Bitel — all work). Cost: ~S/5 ($1.30) for prepaid SIM. Must be able to receive SMS or calls for OTP verification.
- **Website with HTTPS:** Required for Meta verification. Must show business name matching documentation. Even a single-page site works. Yaya already has infrastructure for this via Cloudflare tunnels (e.g., yaya.pe or a subdomain of yaya.sh).
- **Business email:** Ideally on own domain (not Gmail/Hotmail). Can use yaya.sh domain.
- **Payment method:** VISA or MasterCard with international transactions enabled. Meta charges for template messages directly. Peruvian bank cards work if international transactions are enabled. Alternative: PayPal account.
- **Privacy policy:** Published on website. Can be a simple page covering data collection and WhatsApp usage.

### 2.3 Account Requirements

- **Facebook personal account** (to create Business Manager) — Andre must have an active Facebook account with admin access
- **Two-Factor Authentication (2FA)** enabled on Facebook account — mandatory for WhatsApp API access

### 2.4 Critical Peru-Specific Notes

1. **RUC types that work:** RUC starting with 10 (persona natural), 20 (persona jurídica), or 15 (gobierno). For a startup, persona natural con negocio (10-RUC) is simplest.
2. **Business name matching:** The display name on WhatsApp must match or clearly relate to the RUC-registered business name. Meta is strict about this. If the RUC says "ANDRE SURNAME EIRL," the WhatsApp display name must reflect this (with possible brand name addition like "ANDRE SURNAME EIRL - Yaya").
3. **SUNAT status must be "HABIDO":** If the RUC shows "NO HABIDO" (address not verified by SUNAT), Meta will reject. Fix this at SUNAT first.
4. **Peruvian payment processing:** Some Peruvian debit cards don't support international charges. Credit cards from BCP, Interbank, BBVA, or Scotiabank with international transactions enabled work best. Alternatively, use a US-based payment method.

---

## 3. Step-by-Step Setup Process

### Step 1: Create Meta Business Portfolio (Day 1)

1. Go to **business.facebook.com**
2. Click **Create Account**
3. Enter:
   - Business legal name (exactly as on RUC/Escritura Pública)
   - Your name (representative)
   - Business email (on own domain preferred)
4. Fill business details:
   - Address (must match RUC address)
   - Website URL
   - Phone number
5. Confirm email address
6. **Enable 2FA** in Security Center immediately

**⚠️ Common Peru mistake:** Using informal business name instead of RUC-registered name. The name must match legal documents exactly.

### Step 2: Verify Business (Day 1-5)

1. In Meta Business Suite → **Settings** → **Security Center** → **Business Verification**
2. Select Peru as country
3. Enter:
   - Legal business name (from RUC)
   - Tax ID: RUC number (11 digits)
   - Address: Exactly as registered with SUNAT
   - Phone: Number linked to RUC or business
4. Upload documents:
   - **Primary:** Constancia de RUC (downloaded from SUNAT SOL)
   - **Secondary:** Recibo de servicio (utility bill matching address)
   - If Meta requests additional: Escritura Pública or SUNARP partida registral
5. Click **Start Verification**
6. Wait 1-5 business days (typically 2-3 for Peru)

**Verification tips:**
- Documents must be PDF, clear/legible (not photos of printed documents)
- All names and addresses must match exactly across documents
- If rejected, Meta provides a reason — fix the specific issue and resubmit
- Can start with limited API access (250 conversations/day) before verification completes

### Step 3: Create Developer App (Day 1, parallel with Step 2)

1. Go to **developers.facebook.com**
2. Click **My Apps** → **Create App**
3. App name: "Yaya WhatsApp" (internal name, not public)
4. Contact email: your business email
5. Click **Next**
6. Under Use Cases → select **Connect with customers through WhatsApp** (featured)
7. Select the Business Portfolio created in Step 1
8. Click **Go to Dashboard**

### Step 4: Configure WhatsApp Business Account (Day 1-3)

**Option A: From Developer Dashboard**
1. In the app dashboard, click **WhatsApp** → **API Setup**
2. Click **Select phone numbers** dropdown → **Get a new test number** (for testing) or **Add phone number** (for production)

**Option B: From Business Manager (if Option A doesn't show Add)**
1. Go to business.facebook.com → **WhatsApp Accounts** → **Add** → **Create new WhatsApp Business Account**
2. Enter display name (must match verification docs — see Section 2.4)
3. Select category (e.g., "Technology" or "Business Service")
4. Choose your phone number option
5. Verify via SMS or call (OTP)

**Phone number registration:**
- Enter number in international format: +51 XXX XXX XXX
- Select SMS verification
- Enter OTP code
- Wait for account review (typically <24 hours)

**⚠️ Critical:** The phone number used here can NEVER be used on the WhatsApp app again while it's registered with the API. Use a dedicated SIM.

### Step 5: Collect API Credentials (Day 2-3)

After WhatsApp Business Account is created, collect these credentials:

| Credential | Where to Find | Used For |
|---|---|---|
| **Phone Number ID** | Developer Dashboard → WhatsApp → API Setup | Sending messages |
| **WhatsApp Business Account ID** | Business Manager → WhatsApp Accounts | API configuration |
| **App ID** | Developer Dashboard → App Settings → Basic | Authentication |
| **App Secret** | Developer Dashboard → App Settings → Basic (click Show) | Authentication |
| **Permanent Access Token** | Business Manager → System Users (see below) | All API calls |

**Creating Permanent Access Token:**
1. In Business Manager → **Business Settings** → **System Users**
2. Click **Add** → Enter name (e.g., "Yaya API") → Select **Admin** role
3. Click the three dots → **Assign Assets**
4. Assign: Your App (Full Control) + WhatsApp Account (Full Control)
5. Click three dots → **Generate New Token**
6. Select app → Select permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
   - `whatsapp_business_manage_events` (for webhooks)
7. Click **Generate Token**
8. **Copy and save immediately** — this is your permanent Bearer token

### Step 6: Configure Webhook (Day 2-3)

This is where Yaya's server starts receiving messages.

**On d.yaya.sh:**

```python
# webhook.py — FastAPI webhook for WhatsApp Cloud API
from fastapi import FastAPI, Request, Query
from fastapi.responses import PlainTextResponse
import json

app = FastAPI()

VERIFY_TOKEN = "yaya_webhook_verify_2026"  # Your custom token

# Webhook verification (GET) — Meta calls this to verify
@app.get("/webhook")
async def verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge)
    return PlainTextResponse(content="Forbidden", status_code=403)

# Webhook message handler (POST) — receives all events
@app.post("/webhook")
async def webhook(request: Request):
    body = await request.json()
    # MUST return 200 within 5 seconds
    # Process asynchronously via Celery
    process_message.delay(body)
    return {"status": "ok"}
```

**Cloudflare Tunnel setup:**
```bash
# On d.yaya.sh, add tunnel for webhook
# In cloudflare tunnel config, add:
# wa.yaya.sh → localhost:8000
cloudflared tunnel route dns yaya-tunnel wa.yaya.sh
```

**In Meta Developer Dashboard:**
1. Go to WhatsApp → Configuration
2. Webhook URL: `https://wa.yaya.sh/webhook`
3. Verify token: `yaya_webhook_verify_2026`
4. Click **Verify and Save**
5. Subscribe to webhook fields:
   - `messages` ✅ (incoming messages)
   - `message_template_status_update` ✅ (template approvals)

### Step 7: Register Phone Number via Graph API (Day 3)

This step is often missed and causes the "messages not being received" issue:

```bash
# Register the phone number
curl -X POST "https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/register" \
  -H "Authorization: Bearer YOUR_PERMANENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'

# Subscribe app to WhatsApp Business Account
curl -X POST "https://graph.facebook.com/v21.0/WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer YOUR_PERMANENT_TOKEN" \
  -H "Content-Type: application/json"

# Verify subscription
curl -X GET "https://graph.facebook.com/v21.0/WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer YOUR_PERMANENT_TOKEN"
```

### Step 8: Publish App + Add Payment Method (Day 3)

1. **Privacy Policy:** Add a privacy policy URL in App Settings → Basic
2. **Publish:** Click the "Publish" button in the app dashboard
3. **Payment Method:** In Business Manager → WhatsApp Accounts → Payment Settings → Add VISA/MasterCard

### Step 9: Send Test Message (Day 3)

```bash
# Send a test template message
curl -X POST "https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_PERMANENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "51XXXXXXXXX",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": { "code": "es" }
    }
  }'
```

If you receive the hello_world template, the setup is complete. ✅

---

## 4. Post-Setup: Messaging Limits and Scaling

### 4.1 Conversation Tiers

| Tier | Limit | How to Reach |
|---|---|---|
| Unverified | 250 business-initiated conversations/24h | Default |
| Verified (Tier 1) | 1,000/24h | Complete business verification |
| Tier 2 | 10,000/24h | Send 500+ quality conversations |
| Tier 3 | 100,000/24h | Send 5,000+ quality conversations |
| Unlimited | No limit | Send 50,000+ quality conversations |

For Yaya MVP (1-10 users), Tier 1 (1,000/24h) is more than sufficient.

### 4.2 Message Types and Costs (Post-July 2025)

| Type | Definition | Cost |
|---|---|---|
| **Service conversation** | User messages business first; 24h window | **FREE** |
| **Utility template** | Transaction confirmations, alerts, summaries | ~$0.02-0.04/conversation |
| **Marketing template** | Promotions, broadcasts | ~$0.05-0.08/conversation |
| **Authentication template** | OTPs, verification codes | ~$0.02-0.03/conversation |

**Yaya MVP optimization:** Most interactions will be user-initiated (salon owner sends voice note → Yaya responds). These are service conversations = FREE. Only daily summaries (sent proactively by Yaya) would use utility templates.

### 4.3 Template Message Setup

For daily summaries, create and submit templates:

```json
{
  "name": "daily_summary",
  "language": "es",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "📊 Resumen del día {{1}}\n\n💰 Ventas: S/{{2}}\n📦 Transacciones: {{3}}\n💸 Gastos: S/{{4}}\n📋 Fíos pendientes: S/{{5}}\n\nEnvía \"detalle\" para más info.",
      "example": {
        "body_text": [["21/03/2026", "345", "12", "85", "120"]]
      }
    }
  ]
}
```

Template review takes 24-48 hours. Submit templates during Week 1 so they're approved by Week 3.

---

## 5. Voice Note Handling — Technical Details

### 5.1 Receiving Voice Notes

When a user sends a voice note, the webhook receives:

```json
{
  "messages": [{
    "from": "51XXXXXXXXX",
    "id": "wamid.xxx",
    "timestamp": "1711051200",
    "type": "audio",
    "audio": {
      "mime_type": "audio/ogg; codecs=opus",
      "sha256": "...",
      "id": "MEDIA_ID"
    }
  }]
}
```

### 5.2 Downloading Voice Notes

```python
import httpx

async def download_voice_note(media_id: str, token: str) -> bytes:
    # Step 1: Get media URL
    url_response = await httpx.get(
        f"https://graph.facebook.com/v21.0/{media_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    media_url = url_response.json()["url"]
    
    # Step 2: Download media
    media_response = await httpx.get(
        media_url,
        headers={"Authorization": f"Bearer {token}"}
    )
    return media_response.content  # OGG Opus audio bytes
```

### 5.3 Audio Conversion for Whisper

WhatsApp voice notes are OGG Opus format. Whisper expects WAV 16kHz mono:

```bash
# FFmpeg conversion (on c.yaya.sh)
ffmpeg -i input.ogg -ar 16000 -ac 1 -f wav output.wav
```

```python
# Python conversion via subprocess
import subprocess

def convert_ogg_to_wav(ogg_bytes: bytes) -> bytes:
    process = subprocess.run(
        ["ffmpeg", "-i", "pipe:0", "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"],
        input=ogg_bytes,
        capture_output=True
    )
    return process.stdout
```

### 5.4 Sending Responses

```python
async def send_text_message(phone: str, text: str, token: str, phone_number_id: str):
    await httpx.post(
        f"https://graph.facebook.com/v21.0/{phone_number_id}/messages",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": text}
        }
    )
```

---

## 6. WhatsApp Flows Setup

### 6.1 Creating Flows

WhatsApp Flows are created via the Business Manager UI or Graph API:

```bash
# Create a Flow
curl -X POST "https://graph.facebook.com/v21.0/WABA_ID/flows" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sale_confirmation",
    "categories": ["OTHER"]
  }'
```

### 6.2 Flow JSON Structure (Sale Confirmation)

```json
{
  "version": "5.0",
  "screens": [
    {
      "id": "CONFIRM_SALE",
      "title": "Confirmar Venta",
      "data": {
        "amount": {"type": "string", "__example__": "45"},
        "service": {"type": "string", "__example__": "Corte de cabello"},
        "client": {"type": "string", "__example__": "María"}
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {"type": "TextHeading", "text": "¿Registrar esta venta?"},
          {"type": "TextBody", "text": "Servicio: ${data.service}"},
          {"type": "TextBody", "text": "Monto: S/${data.amount}"},
          {"type": "TextBody", "text": "Cliente: ${data.client}"},
          {
            "type": "Dropdown",
            "name": "payment_method",
            "label": "Método de pago",
            "data-source": [
              {"id": "cash", "title": "Efectivo"},
              {"id": "yape", "title": "Yape"},
              {"id": "plin", "title": "Plin"},
              {"id": "transfer", "title": "Transferencia"},
              {"id": "fio", "title": "Fío (crédito)"}
            ]
          },
          {
            "type": "Footer",
            "label": "✅ Confirmar",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "confirmed": true,
                "payment_method": "${form.payment_method}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

### 6.3 Flow Endpoint

Flows require a hosted endpoint that handles Flow data exchange:

```python
@app.post("/flow-endpoint")
async def flow_endpoint(request: Request):
    body = await request.json()
    # Decrypt, process, return next screen or completion
    # See Meta documentation for encryption/decryption details
    action = body.get("action")
    
    if action == "ping":
        return {"data": {"status": "active"}}
    
    if action == "INIT":
        # Return initial screen data
        return {
            "screen": "CONFIRM_SALE",
            "data": {
                "amount": body["data"]["amount"],
                "service": body["data"]["service"],
                "client": body["data"]["client"]
            }
        }
    
    if action == "data_exchange":
        # Handle flow completion
        return {"screen": "SUCCESS", "data": {}}
```

---

## 7. Troubleshooting Guide

### 7.1 Common Issues

| Problem | Cause | Solution |
|---|---|---|
| Webhook not receiving messages | Phone number not registered via Graph API | Run the registration curl command (Step 7) |
| "Account under review" | Business verification pending | Wait 2-5 days; check documents match |
| Verification rejected | Name mismatch between docs | Ensure RUC name exactly matches Business Manager name |
| Can't add payment method | Peruvian card without intl. transactions | Enable international payments or use PayPal |
| Messages sent but not delivered | Template not approved or wrong format | Check template status in Business Manager |
| Rate limited | Exceeded tier limit | Wait 24h; quality rating affects limits |
| Voice notes not downloading | Token expired or wrong permissions | Re-check permanent token permissions |

### 7.2 Peru-Specific Issues

- **RUC status "NO HABIDO":** Fix at SUNAT before attempting Meta verification. Requires visiting a SUNAT office to update address.
- **Display name rejected:** Must clearly relate to RUC-registered name. Try format: "Legal Name - Brand Name" or just the legal name.
- **Documents in Spanish:** Meta accepts Spanish-language documents for Peru verification. No translation needed.
- **Multiple RUC types:** Persona natural (10-RUC) is easiest for a solo founder. Can upgrade to EIRL or SAC later.

---

## 8. Security Considerations

### 8.1 Token Security

- Store permanent access token in environment variables, NEVER in code
- On d.yaya.sh: use `.env` file with restricted permissions (chmod 600)
- Rotate token every 90 days (create new system user token, update .env, delete old)

### 8.2 Webhook Security

- Validate webhook signatures on every POST request
- Use HTTPS exclusively (Cloudflare tunnel handles this)
- Implement rate limiting on webhook endpoint

```python
import hmac
import hashlib

def validate_signature(payload: bytes, signature: str, app_secret: str) -> bool:
    expected = hmac.new(
        app_secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

### 8.3 Data Privacy

- Voice notes contain personal financial data — encrypt at rest
- Don't log raw voice note content to console/files
- Implement data retention policy (delete voice files after transcription)
- Comply with Peru's Ley de Protección de Datos Personales (Law 29733)

---

## 9. Cost Projection for MVP

| Phase | Monthly Messages | Service (Free) | Utility Templates | Marketing | Total Cost |
|---|---|---|---|---|---|
| Week 1-4 (testing) | ~100 | 90% | 10% | 0% | ~$0.40 |
| Week 5-8 (Customer Zero) | ~500 | 80% | 18% | 2% | ~$5 |
| Week 9-12 (10 users) | ~3,000 | 75% | 22% | 3% | ~$30 |
| Month 4-6 (50 users) | ~15,000 | 70% | 25% | 5% | ~$180 |

**Conclusion:** WhatsApp API costs are negligible for MVP phase. The free service conversation model means most Yaya interactions cost nothing.

---

## 10. Day-by-Day Action Plan

| Day | Action | Blocker? | Duration |
|---|---|---|---|
| Day 1 AM | Create Meta Business Portfolio + enable 2FA | No | 30 min |
| Day 1 PM | Start business verification (upload RUC + utility bill) | No | 1 hour |
| Day 1 PM | Create Developer App + configure WhatsApp product | No | 30 min |
| Day 2 AM | Buy dedicated SIM card (S/5) + register phone number | No | 1 hour |
| Day 2 PM | Set up Cloudflare tunnel for wa.yaya.sh | No | 30 min |
| Day 2 PM | Deploy FastAPI webhook skeleton on d.yaya.sh | No | 2 hours |
| Day 3 AM | Configure webhook in Meta dashboard | Needs webhook deployed | 30 min |
| Day 3 AM | Create system user + generate permanent token | Needs app published | 1 hour |
| Day 3 PM | Register phone number via Graph API | Needs token + number | 30 min |
| Day 3 PM | Send first test message + verify webhook receives | All prerequisites | 30 min |
| Day 4-5 | Submit message templates for approval | Needs verified WABA | 1 hour |
| Day 4-7 | Wait for business verification (work on other tasks) | Meta review time | — |

**Total active setup time: ~8 hours spread across 3 days, plus 2-5 day wait for verification.**

---

*This playbook turns the "Set up Meta Business Account" bullet point from the 12-week plan into a concrete, step-by-step procedure with Peru-specific requirements, code samples, and troubleshooting. Every command can be copy-pasted. Every document can be gathered in advance. There are no unknowns — only execution.*
