#!/usr/bin/env python3
"""
Yape Payment MCP Server

Provides tools for the AI agent to check Yape payments received via the
yape-listener backend service.

Tools:
  - check_payment: Check if a Yape payment of a given amount was received
  - list_pending_payments: List all unmatched payments
  - confirm_payment: Mark a payment as matched to an order
  - get_today_summary: Today's total received, count, list
"""

import logging
import os

import httpx
from mcp.server.fastmcp import FastMCP

logger = logging.getLogger("yape-mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

YAPE_LISTENER_URL = os.environ.get("YAPE_LISTENER_URL", "http://localhost:3001")
YAPE_API_KEY = os.environ.get("YAPE_API_KEY", "")

_client: httpx.Client | None = None


def get_client() -> httpx.Client:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.Client(
            base_url=YAPE_LISTENER_URL,
            headers={"X-Api-Key": YAPE_API_KEY},
            timeout=10.0,
        )
    return _client


# ── MCP Server ───────────────────────────────────────────────

mcp = FastMCP("yape-mcp")


@mcp.tool(description="Check if a Yape payment of a specific amount was received. Returns match info with ±1 sol tolerance.")
def check_payment(amount: float, sender_name: str = "", tolerance: float = 1.0) -> str:
    """Check if a Yape payment of this amount was received.

    Args:
        amount: Payment amount in soles to look for
        sender_name: Optional sender name to narrow the search
        tolerance: Amount tolerance in soles (default ±1.0)
    """
    client = get_client()
    params: dict = {"amount": str(amount), "tolerance": str(tolerance)}
    if sender_name:
        params["name"] = sender_name

    try:
        resp = client.get("/api/v1/payments/match", params=params)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error("check_payment failed: %s", e)
        return f"Error checking payment: {e}"

    if not data.get("found"):
        return (
            f"No Yape payment found for S/ {amount:.2f}"
            + (f" from '{sender_name}'" if sender_name else "")
            + f" (tolerance: ±S/ {tolerance:.2f})"
        )

    payment = data["payment"]
    candidates = data.get("candidates", [])

    result = (
        f"Payment FOUND\n"
        f"  ID: {payment['id']}\n"
        f"  Sender: {payment['sender_name']}\n"
        f"  Amount: S/ {payment['amount']:.2f}\n"
        f"  Received: {payment['created_at']}\n"
        f"  Status: {payment['status']}\n"
    )

    if len(candidates) > 1:
        result += f"\n  ({len(candidates)} total candidates within tolerance)"

    return result


@mcp.tool(description="List all unmatched/pending Yape payments waiting to be confirmed.")
def list_pending_payments() -> str:
    """List all unmatched Yape payments."""
    client = get_client()

    try:
        resp = client.get("/api/v1/payments/pending")
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error("list_pending_payments failed: %s", e)
        return f"Error listing payments: {e}"

    payments = data.get("payments", [])
    count = data.get("count", 0)

    if count == 0:
        return "No pending payments."

    lines = [f"Pending payments: {count}\n"]
    for p in payments:
        lines.append(
            f"  #{p['id']} — S/ {p['amount']:.2f} from {p['sender_name']} ({p['created_at']})"
        )

    return "\n".join(lines)


@mcp.tool(description="Confirm/match a Yape payment to an order. Marks it as confirmed so it won't appear in pending.")
def confirm_payment(payment_id: int, order_description: str) -> str:
    """Mark a Yape payment as matched to an order.

    Args:
        payment_id: The payment ID to confirm
        order_description: Description of the order this payment is for
    """
    client = get_client()

    try:
        resp = client.post(
            f"/api/v1/payments/confirm/{payment_id}",
            json={"orderDescription": order_description},
        )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return f"Payment #{payment_id} not found."
        return f"Error confirming payment: {e}"
    except Exception as e:
        logger.error("confirm_payment failed: %s", e)
        return f"Error confirming payment: {e}"

    payment = data.get("payment", {})
    return (
        f"Payment #{payment.get('id')} confirmed\n"
        f"  Amount: S/ {payment.get('amount', 0):.2f}\n"
        f"  Sender: {payment.get('sender_name', '?')}\n"
        f"  Matched to: {payment.get('matched_order', order_description)}"
    )


@mcp.tool(description="Get today's Yape payment summary — total received, count, and payment list.")
def get_today_summary() -> str:
    """Get today's Yape payment summary."""
    client = get_client()

    try:
        resp = client.get("/api/v1/payments/stats")
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error("get_today_summary failed: %s", e)
        return f"Error getting summary: {e}"

    total = data.get("total_received", 0)
    count = data.get("count", 0)
    confirmed = data.get("confirmed", 0)
    pending = data.get("pending", 0)
    payments = data.get("payments", [])

    lines = [
        f"Today's Yape Summary",
        f"  Total received: S/ {total:.2f}",
        f"  Payments: {count} ({confirmed} confirmed, {pending} pending)",
    ]

    if payments:
        lines.append("\nPayments:")
        for p in payments:
            status_icon = "+" if p["status"] == "confirmed" else "?"
            lines.append(
                f"  [{status_icon}] #{p['id']} S/ {p['amount']:.2f} — {p['sender_name']}"
            )

    return "\n".join(lines)


# ── Entrypoint ───────────────────────────────────────────────

def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
