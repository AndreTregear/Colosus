#!/usr/bin/env python3
"""
WhatsApp Outbound MCP Server (Python)

Provides outbound messaging tools for WhatsApp via:
  - WhatsApp Business Cloud API (primary)
  - WAHA/Baileys gateway (fallback, unofficial)

Tools:
  send_text          — Send a text message
  send_template      — Send a pre-approved template message
  send_image         — Send an image with caption
  send_document      — Send a PDF/document
  send_payment_link  — Generate and send a Yape/Plin payment link
  send_reminder      — Send appointment reminder from template
  send_bulk          — Bulk send with rate limiting
  get_message_status — Check delivery/read status
  schedule_message   — Schedule a message for later delivery
"""

import asyncio
import json
import logging
import os
import re
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import Field

# ── Logging ──────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("whatsapp-mcp")

# ── Configuration ────────────────────────────────────────

# Cloud API (primary)
CLOUD_API_URL = os.environ.get(
    "WHATSAPP_CLOUD_API_URL",
    "https://graph.facebook.com/v21.0",
)
CLOUD_API_TOKEN = os.environ.get("WHATSAPP_CLOUD_API_TOKEN", "")
PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")

# WAHA / Baileys gateway (fallback)
GATEWAY_URL = os.environ.get("OPENCLAW_GATEWAY_URL", "http://localhost:3284")
GATEWAY_ACCOUNT = os.environ.get("WHATSAPP_ACCOUNT", "default")

# General
REQUEST_TIMEOUT = int(os.environ.get("WHATSAPP_TIMEOUT_S", "15"))
RATE_LIMIT_PER_SECOND = int(os.environ.get("WHATSAPP_RATE_LIMIT", "80"))
TEMPLATES_DIR = Path(__file__).parent / "templates"
OPT_OUT_FILE = Path(os.environ.get(
    "WHATSAPP_OPT_OUT_FILE",
    str(Path(__file__).parent / ".opt_out_list.json"),
))
MESSAGE_LOG_FILE = Path(os.environ.get(
    "WHATSAPP_MESSAGE_LOG",
    str(Path(__file__).parent / ".message_log.jsonl"),
))

# Scheduled messages (in-memory for now; production should use a persistent store)
_scheduled: list[dict[str, Any]] = []
_scheduler_task: asyncio.Task | None = None

# ── Helpers ──────────────────────────────────────────────

_E164_RE = re.compile(r"^\+\d{10,15}$")


def normalize_phone(phone: str) -> str:
    """Normalize a phone number to E.164 format."""
    cleaned = re.sub(r"[\s\-()]", "", phone)
    if not cleaned.startswith("+") and re.match(r"^\d{10,15}$", cleaned):
        cleaned = f"+{cleaned}"
    if not _E164_RE.match(cleaned):
        raise ValueError(
            f'Invalid phone number "{phone}". Use E.164 format (e.g., +51999888777).'
        )
    return cleaned


def _log_message(entry: dict[str, Any]) -> None:
    """Append a message to the audit log (JSONL)."""
    entry["logged_at"] = datetime.now(timezone.utc).isoformat()
    try:
        with open(MESSAGE_LOG_FILE, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError as exc:
        logger.warning("Failed to write message log: %s", exc)


def _load_opt_outs() -> set[str]:
    """Load the set of opted-out phone numbers."""
    if OPT_OUT_FILE.exists():
        try:
            data = json.loads(OPT_OUT_FILE.read_text())
            return set(data) if isinstance(data, list) else set()
        except (json.JSONDecodeError, OSError):
            pass
    return set()


def _check_opt_out(phone: str) -> None:
    """Raise if the phone number has opted out."""
    if phone in _load_opt_outs():
        raise ValueError(
            f"Phone {phone} has opted out of messages. Respecting customer preference."
        )


def _load_template(template_name: str) -> dict[str, Any]:
    """Load a message template from the templates directory."""
    path = TEMPLATES_DIR / f"{template_name}.json"
    if not path.exists():
        available = [p.stem for p in TEMPLATES_DIR.glob("*.json")]
        raise ValueError(
            f'Unknown template "{template_name}". Available: {", ".join(available)}'
        )
    return json.loads(path.read_text())


def _render_template(template_name: str, variables: dict[str, str]) -> str:
    """Load a template and render it with the provided variables."""
    tmpl = _load_template(template_name)
    body_component = next(
        (c for c in tmpl.get("components", []) if c.get("type") == "BODY"),
        None,
    )
    if not body_component:
        raise ValueError(f'Template "{template_name}" has no BODY component.')

    text = body_component["text"]
    for key, value in variables.items():
        text = text.replace(f"{{{{{key}}}}}", str(value))
    return text


# ── HTTP Clients ─────────────────────────────────────────


async def _cloud_api_send(payload: dict[str, Any]) -> dict[str, Any]:
    """Send a message via WhatsApp Business Cloud API."""
    if not CLOUD_API_TOKEN or not PHONE_NUMBER_ID:
        raise RuntimeError(
            "Cloud API not configured. Set WHATSAPP_CLOUD_API_TOKEN and "
            "WHATSAPP_PHONE_NUMBER_ID environment variables."
        )

    url = f"{CLOUD_API_URL}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {CLOUD_API_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            detail = resp.text
            try:
                detail = resp.json().get("error", {}).get("message", detail)
            except Exception:
                pass
            raise RuntimeError(f"Cloud API {resp.status_code}: {detail}")
        data = resp.json()
        return {
            "message_id": data.get("messages", [{}])[0].get("id"),
            "api": "cloud",
        }


async def _gateway_send(payload: dict[str, Any]) -> dict[str, Any]:
    """Send a message via WAHA/Baileys gateway (fallback)."""
    url = f"{GATEWAY_URL}/api/sessions/{GATEWAY_ACCOUNT}/send"
    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            detail = resp.text
            try:
                parsed = resp.json()
                detail = parsed.get("error") or parsed.get("message") or detail
            except Exception:
                pass
            raise RuntimeError(f"Gateway {resp.status_code}: {detail}")
        data = resp.json()
        return {
            "message_id": data.get("id") or data.get("message_id"),
            "api": "gateway",
        }


async def _send_message(to: str, msg_type: str, content: dict[str, Any]) -> dict[str, Any]:
    """
    Send a WhatsApp message, trying Cloud API first, then gateway fallback.
    Returns a dict with message_id, api used, phone, and timestamp.
    """
    phone = normalize_phone(to)
    _check_opt_out(phone)

    cloud_payload = {
        "messaging_product": "whatsapp",
        "to": phone.lstrip("+"),
        "type": msg_type,
        **content,
    }

    gateway_payload = {
        "to": phone,
        "type": msg_type,
        **content,
    }

    result: dict[str, Any] | None = None
    errors: list[str] = []

    # Try Cloud API first
    if CLOUD_API_TOKEN and PHONE_NUMBER_ID:
        try:
            result = await _cloud_api_send(cloud_payload)
        except Exception as exc:
            errors.append(f"Cloud API: {exc}")
            logger.warning("Cloud API failed: %s", exc)

    # Fallback to gateway
    if result is None:
        try:
            result = await _gateway_send(gateway_payload)
        except Exception as exc:
            errors.append(f"Gateway: {exc}")
            logger.warning("Gateway failed: %s", exc)

    if result is None:
        raise RuntimeError(
            f"All send methods failed. Errors: {'; '.join(errors)}"
        )

    outcome = {
        "success": True,
        "message_id": result.get("message_id"),
        "phone": phone,
        "api": result.get("api"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    _log_message({"action": "send", "type": msg_type, **outcome})
    return outcome


# ── Scheduler ────────────────────────────────────────────

async def _scheduler_loop() -> None:
    """Background loop that sends scheduled messages when their time arrives."""
    while True:
        now = datetime.now(timezone.utc)
        due = [m for m in _scheduled if datetime.fromisoformat(m["send_at"]) <= now]
        for msg in due:
            _scheduled.remove(msg)
            try:
                result = await _send_message(
                    msg["to_phone"], "text", {"text": {"body": msg["message"]}}
                )
                logger.info("Scheduled message sent: %s -> %s", msg["to_phone"], result.get("message_id"))
            except Exception as exc:
                logger.error("Failed to send scheduled message to %s: %s", msg["to_phone"], exc)
        await asyncio.sleep(10)


def _ensure_scheduler() -> None:
    """Start the scheduler background task if not already running."""
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())


# ── MCP Server ───────────────────────────────────────────

mcp = FastMCP("whatsapp-mcp")


@mcp.tool(description="Send a text message to a WhatsApp number (E.164 format, e.g. +51999888777).")
async def send_text(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    message: str = Field(description="Message text to send"),
) -> str:
    result = await _send_message(to_phone, "text", {"text": {"body": message}})
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool(
    description="Send a pre-approved template message. Templates: appointment_reminder, "
    "payment_confirmation, payment_reminder, shipping_update, fiado_reminder, welcome."
)
async def send_template(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    template_name: str = Field(description="Template name (e.g. appointment_reminder)"),
    variables: dict[str, str] = Field(
        description="Template variables as key-value pairs (e.g. {name: 'María', time: '10:00 AM'})"
    ),
) -> str:
    rendered = _render_template(template_name, variables)
    result = await _send_message(to_phone, "text", {"text": {"body": rendered}})
    result["template"] = template_name
    result["rendered_message"] = rendered
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool(description="Send an image with an optional caption to a WhatsApp number.")
async def send_image(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    image_url: str = Field(description="Publicly accessible image URL"),
    caption: str = Field(default="", description="Optional caption for the image"),
) -> str:
    content: dict[str, Any] = {"image": {"link": image_url}}
    if caption:
        content["image"]["caption"] = caption
    result = await _send_message(to_phone, "image", content)
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool(description="Send a PDF or other document to a WhatsApp number.")
async def send_document(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    doc_url: str = Field(description="Publicly accessible document URL"),
    filename: str = Field(default="document.pdf", description="Display filename"),
) -> str:
    content: dict[str, Any] = {
        "document": {"link": doc_url, "filename": filename},
    }
    result = await _send_message(to_phone, "document", content)
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool(
    description="Generate a Yape/Plin payment link and send it to a WhatsApp number. "
    "Constructs a payment message with amount and description."
)
async def send_payment_link(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    amount: str = Field(description="Payment amount (e.g. '85.00')"),
    description: str = Field(default="", description="What the payment is for"),
) -> str:
    # Build payment message with Yape/Plin instructions
    # In production, this would integrate with a payment gateway to generate a real link
    payment_phone = os.environ.get("YAPE_PLIN_PHONE", PHONE_NUMBER_ID or "+51999888777")
    lines = [
        f"💰 Solicitud de pago: S/{amount}",
    ]
    if description:
        lines.append(f"Concepto: {description}")
    lines.extend([
        "",
        "Puedes pagar por:",
        f"• Yape: al número {payment_phone}",
        f"• Plin: al número {payment_phone}",
        "",
        f"Monto exacto: S/{amount}",
        "",
        "Envíanos el comprobante por este chat para confirmar tu pago. ¡Gracias! 🙏",
    ])
    message = "\n".join(lines)

    result = await _send_message(to_phone, "text", {"text": {"body": message}})
    result["payment_amount"] = amount
    result["payment_description"] = description
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool(
    description="Send an appointment reminder using the appointment_reminder template. "
    "Looks up appointment details by ID (or uses provided data)."
)
async def send_reminder(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    appointment_id: str = Field(default="", description="Appointment ID to look up"),
    name: str = Field(default="", description="Customer name (if not using appointment lookup)"),
    time: str = Field(default="", description="Appointment time (if not using appointment lookup)"),
    location: str = Field(default="", description="Appointment location (if not using appointment lookup)"),
) -> str:
    # In production, appointment_id would look up from appointments-mcp or a database.
    # For now, use the provided fields or defaults.
    variables = {
        "name": name or "cliente",
        "time": time or "la hora acordada",
        "location": location or "nuestro local",
    }

    if appointment_id:
        # Try to fetch from appointments system via gateway
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(
                    f"{GATEWAY_URL}/api/appointments/{appointment_id}"
                )
                if resp.status_code == 200:
                    appt = resp.json()
                    variables["name"] = appt.get("customer_name", variables["name"])
                    variables["time"] = appt.get("time", variables["time"])
                    variables["location"] = appt.get("location", variables["location"])
        except Exception as exc:
            logger.warning("Could not fetch appointment %s: %s", appointment_id, exc)

    rendered = _render_template("appointment_reminder", variables)
    result = await _send_message(to_phone, "text", {"text": {"body": rendered}})
    result["template"] = "appointment_reminder"
    result["appointment_id"] = appointment_id
    result["rendered_message"] = rendered
    return json.dumps(result, indent=2, ensure_ascii=False)


@mcp.tool(
    description="Send a message to multiple phone numbers with rate limiting. "
    "Max 80 msg/s for Cloud API, configurable for gateway."
)
async def send_bulk(
    phone_list: list[str] = Field(description="List of phone numbers in E.164 format"),
    message: str = Field(description="Message text to send to all recipients"),
    rate_limit: int = Field(
        default=0,
        description="Max messages per second (0 = use default from config)",
    ),
) -> str:
    effective_rate = rate_limit if rate_limit > 0 else RATE_LIMIT_PER_SECOND
    delay = 1.0 / effective_rate

    results: list[dict[str, Any]] = []
    succeeded = 0
    failed = 0

    for phone in phone_list:
        try:
            r = await _send_message(phone, "text", {"text": {"body": message}})
            results.append(r)
            succeeded += 1
        except Exception as exc:
            results.append({
                "success": False,
                "phone": phone,
                "error": str(exc),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            failed += 1

        await asyncio.sleep(delay)

    summary = {
        "total": len(phone_list),
        "succeeded": succeeded,
        "failed": failed,
        "rate_limit_per_second": effective_rate,
        "results": results,
    }
    return json.dumps(summary, indent=2, ensure_ascii=False)


@mcp.tool(
    description="Check delivery/read status of a previously sent message by its ID."
)
async def get_message_status(
    message_id: str = Field(description="Message ID returned from a send operation"),
) -> str:
    errors: list[str] = []

    # Try Cloud API
    if CLOUD_API_TOKEN and PHONE_NUMBER_ID:
        try:
            url = f"{CLOUD_API_URL}/{message_id}"
            headers = {"Authorization": f"Bearer {CLOUD_API_TOKEN}"}
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code < 400:
                    data = resp.json()
                    return json.dumps({
                        "message_id": message_id,
                        "status": data.get("status", "unknown"),
                        "timestamp": data.get("timestamp"),
                        "api": "cloud",
                    }, indent=2)
        except Exception as exc:
            errors.append(f"Cloud API: {exc}")

    # Try gateway
    try:
        url = f"{GATEWAY_URL}/api/sessions/{GATEWAY_ACCOUNT}/messages/{message_id}/status"
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(url)
            if resp.status_code < 400:
                data = resp.json()
                return json.dumps({
                    "message_id": message_id,
                    "status": data.get("status", "unknown"),
                    "timestamp": data.get("timestamp"),
                    "api": "gateway",
                }, indent=2)
            errors.append(f"Gateway: {resp.status_code}")
    except Exception as exc:
        errors.append(f"Gateway: {exc}")

    # Check local log as last resort
    if MESSAGE_LOG_FILE.exists():
        try:
            with open(MESSAGE_LOG_FILE) as f:
                for line in f:
                    entry = json.loads(line)
                    if entry.get("message_id") == message_id:
                        return json.dumps({
                            "message_id": message_id,
                            "status": "sent_locally_logged",
                            "sent_at": entry.get("timestamp"),
                            "phone": entry.get("phone"),
                            "note": "Status from local log; real-time status unavailable.",
                        }, indent=2)
        except Exception:
            pass

    return json.dumps({
        "message_id": message_id,
        "status": "unknown",
        "errors": errors,
    }, indent=2)


@mcp.tool(
    description="Schedule a message for later delivery. "
    "The message will be sent automatically at the specified time (UTC ISO 8601)."
)
async def schedule_message(
    to_phone: str = Field(description="Recipient phone in E.164 format"),
    message: str = Field(description="Message text to send"),
    send_at: str = Field(
        description="When to send (UTC ISO 8601, e.g. '2026-03-22T14:00:00Z')"
    ),
) -> str:
    phone = normalize_phone(to_phone)
    _check_opt_out(phone)

    # Validate send_at
    try:
        scheduled_time = datetime.fromisoformat(send_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"Invalid send_at format: {exc}. Use ISO 8601 (e.g. 2026-03-22T14:00:00Z).") from exc

    if scheduled_time <= datetime.now(timezone.utc):
        raise ValueError("send_at must be in the future.")

    entry = {
        "to_phone": phone,
        "message": message,
        "send_at": scheduled_time.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _scheduled.append(entry)
    _ensure_scheduler()

    _log_message({"action": "schedule", **entry})

    return json.dumps({
        "success": True,
        "scheduled": True,
        "phone": phone,
        "send_at": scheduled_time.isoformat(),
        "pending_scheduled": len(_scheduled),
    }, indent=2, ensure_ascii=False)


# ── Entrypoint ───────────────────────────────────────────

shutdown_in_progress = False


async def shutdown(sig: signal.Signals | None = None) -> None:
    global shutdown_in_progress
    if shutdown_in_progress:
        sys.exit(1)
    shutdown_in_progress = True

    if sig:
        logger.info("Received signal %s, shutting down...", sig.name)

    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass

    sys.exit(128 + sig.value if sig else 0)


async def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="WhatsApp Outbound MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse", "streamable-http"],
        default="stdio",
        help="MCP transport (default: stdio)",
    )
    parser.add_argument("--host", default="localhost", help="Host for SSE/HTTP transport")
    parser.add_argument("--port", type=int, default=8001, help="Port for SSE/HTTP transport")
    args = parser.parse_args()

    # Signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(shutdown(s)))

    logger.info(
        "WhatsApp MCP server starting (transport=%s, cloud_api=%s, gateway=%s)",
        args.transport,
        "configured" if CLOUD_API_TOKEN else "not configured",
        GATEWAY_URL,
    )

    if args.transport == "stdio":
        await mcp.run_stdio_async()
    elif args.transport == "sse":
        await mcp.run_sse_async(host=args.host, port=args.port)
    elif args.transport == "streamable-http":
        await mcp.run_streamable_http_async(host=args.host, port=args.port)


if __name__ == "__main__":
    asyncio.run(main())
