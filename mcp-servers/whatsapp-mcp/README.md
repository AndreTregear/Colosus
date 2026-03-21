# WhatsApp Outbound MCP Server

Python MCP server that enables AI agents to send outbound WhatsApp messages. Supports WhatsApp Business Cloud API (primary) with WAHA/Baileys gateway fallback.

## Tools

| Tool | Description |
|------|-------------|
| `send_text` | Send a text message to a phone number |
| `send_template` | Send a pre-approved template message with variables |
| `send_image` | Send an image with optional caption |
| `send_document` | Send a PDF or document file |
| `send_payment_link` | Generate and send a Yape/Plin payment link |
| `send_reminder` | Send appointment reminder (fetches from appointments system) |
| `send_bulk` | Bulk send with configurable rate limiting |
| `get_message_status` | Check delivery/read status of a sent message |
| `schedule_message` | Schedule a message for future delivery (UTC) |

## Setup

```bash
pip install -r requirements.txt
```

### Environment Variables

**WhatsApp Business Cloud API (primary):**
```bash
WHATSAPP_CLOUD_API_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_CLOUD_API_URL=https://graph.facebook.com/v21.0  # optional
```

**WAHA/Baileys Gateway (fallback):**
```bash
OPENCLAW_GATEWAY_URL=http://localhost:3284
WHATSAPP_ACCOUNT=default
```

**General:**
```bash
WHATSAPP_TIMEOUT_S=15
WHATSAPP_RATE_LIMIT=80          # messages per second
YAPE_PLIN_PHONE=+51999888777   # payment collection number
WHATSAPP_OPT_OUT_FILE=.opt_out_list.json
WHATSAPP_MESSAGE_LOG=.message_log.jsonl
```

## Running

```bash
# stdio transport (default — for MCP client integration)
python server.py

# SSE transport (for HTTP-based clients)
python server.py --transport sse --host 0.0.0.0 --port 8001

# Streamable HTTP transport
python server.py --transport streamable-http --port 8001
```

## Templates

Pre-built Spanish-language message templates in `templates/`:

| Template | Use Case |
|----------|----------|
| `appointment_reminder` | Cita reminder with confirm/reschedule |
| `payment_confirmation` | Order payment confirmed |
| `payment_reminder` | Pending payment notification |
| `shipping_update` | Package shipped with tracking |
| `fiado_reminder` | Friendly credit/fiado balance reminder |
| `welcome` | New customer welcome message |

### Template Variables

Each template JSON defines its required variables. Example usage:

```python
# Via MCP tool call
send_template(
    to_phone="+51999888777",
    template_name="fiado_reminder",
    variables={"name": "Rosa", "amount": "45.50", "payment_phone": "+51999000111"}
)
```

## Architecture

```
Cloud API (Meta) ──primary──▶ WhatsApp
       │
       │ (fallback if Cloud API unconfigured or fails)
       ▼
WAHA Gateway ──fallback──▶ WhatsApp
```

- **Cloud API**: Official Meta Business API. Requires approved business account. Rate limit: 80 msg/s.
- **WAHA/Baileys**: Unofficial gateway common in LATAM startups. Self-hosted. Configurable rate limit.

### Safety Features

- **Opt-out list**: Maintains a JSON list of numbers that have opted out. All send tools check before sending.
- **Message audit log**: Every outbound message is logged to a JSONL file with timestamps and message IDs.
- **Rate limiting**: Bulk sends enforce configurable rate limits to avoid API throttling.
- **E.164 validation**: All phone numbers are validated and normalized before sending.

## Existing TypeScript Server

The `src/index.ts` TypeScript server remains available as the original implementation with 5 basic tools (send_message, send_media, send_template_message, get_chat_history, check_online_status). This Python server extends those capabilities with payment links, bulk sending, scheduling, and structured templates.
