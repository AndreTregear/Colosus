#!/usr/bin/env python3
"""
Forex MCP Server (Python)

Provides real-time and historical exchange rates with Peru-specific sources.
Fallback chain: SBS Peru → BCR Peru → exchangerate-api.com → error

Tools:
  - get_rate: Current exchange rate between two currencies
  - convert: Convert an amount between currencies
  - get_historical_rate: Rate for a specific past date
  - get_sbs_rates: Official SBS Peru buy/sell rates for USD and EUR

Supported currencies: PEN, USD, EUR, CNY, BRL, COP, MXN, GBP, JPY
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

logger = logging.getLogger("forex-mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

SUPPORTED_CURRENCIES = {"PEN", "USD", "EUR", "CNY", "BRL", "COP", "MXN", "GBP", "JPY"}

# ── Cache ────────────────────────────────────────────────────

CACHE_TTL_SECONDS = 15 * 60  # 15 minutes

_rate_cache: dict[str, dict[str, Any]] = {}
_sbs_cache: dict[str, Any] | None = None
_sbs_cache_ts: float = 0.0


def _cache_get(key: str) -> dict[str, float] | None:
    entry = _rate_cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL_SECONDS:
        return entry["rates"]
    return None


def _cache_set(key: str, rates: dict[str, float]) -> None:
    _rate_cache[key] = {"rates": rates, "ts": time.time()}


# ── HTTP client ──────────────────────────────────────────────

_client: httpx.AsyncClient | None = None


async def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=15.0)
    return _client


# ── SBS Peru API ─────────────────────────────────────────────

SBS_API_URL = "https://api.apis.net.pe/v2/sbs/tipo-cambio"


async def fetch_sbs_rates() -> dict[str, Any]:
    """Fetch official SBS Peru buy/sell rates for USD and EUR."""
    global _sbs_cache, _sbs_cache_ts

    if _sbs_cache and (time.time() - _sbs_cache_ts) < CACHE_TTL_SECONDS:
        return _sbs_cache

    client = await get_client()
    resp = await client.get(SBS_API_URL)
    resp.raise_for_status()
    data = resp.json()

    result = {
        "source": "SBS Peru (via apis.net.pe)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "USD": {
            "buy": data.get("compra", data.get("precio_compra")),
            "sell": data.get("venta", data.get("precio_venta")),
        },
        "EUR": {
            "buy": data.get("compra_euro"),
            "sell": data.get("venta_euro"),
        },
    }

    _sbs_cache = result
    _sbs_cache_ts = time.time()
    return result


# ── BCR Peru API ─────────────────────────────────────────────

BCR_API_URL = "https://estadisticas.bcrp.gob.pe/estadisticas/series/api"

# BCR series codes for USD/PEN
BCR_USD_BUY = "PD04637PD"
BCR_USD_SELL = "PD04638PD"


async def fetch_bcr_rate() -> dict[str, float]:
    """Fetch BCR Peru official USD/PEN rates."""
    client = await get_client()
    today = datetime.now().strftime("%Y-%m-%d")
    url = f"{BCR_API_URL}/{BCR_USD_BUY}-{BCR_USD_SELL}/json/{today}/{today}"
    resp = await client.get(url)
    resp.raise_for_status()
    data = resp.json()

    periods = data.get("periods", [])
    if not periods:
        raise ValueError("No BCR data for today")

    values = periods[0].get("values", [])
    buy = float(values[0]) if len(values) > 0 and values[0] != "n.d." else None
    sell = float(values[1]) if len(values) > 1 and values[1] != "n.d." else None

    if buy is None or sell is None:
        raise ValueError("BCR returned n.d. (no data)")

    return {"buy": buy, "sell": sell, "mid": round((buy + sell) / 2, 4)}


# ── ExchangeRate-API (free tier) ─────────────────────────────

EXCHANGERATE_API_URL = "https://open.er-api.com/v6/latest"


async def fetch_exchangerate_api(base: str) -> dict[str, float]:
    """Fetch rates from ExchangeRate-API (free, no key)."""
    client = await get_client()
    resp = await client.get(f"{EXCHANGERATE_API_URL}/{base.upper()}")
    resp.raise_for_status()
    data = resp.json()

    if data.get("result") == "error" or "rates" not in data:
        raise ValueError(f"ExchangeRate-API error for {base}")

    return data["rates"]


# ── Fallback chain ───────────────────────────────────────────


async def get_rate_with_fallback(from_ccy: str, to_ccy: str) -> dict[str, Any]:
    """
    Get exchange rate using fallback chain:
    SBS API → BCR → exchangerate-api.com → error
    """
    from_ccy = from_ccy.upper()
    to_ccy = to_ccy.upper()

    if from_ccy == to_ccy:
        return {"rate": 1.0, "source": "identity", "timestamp": datetime.now(timezone.utc).isoformat()}

    cache_key = f"{from_ccy}_{to_ccy}"
    cached = _cache_get(cache_key)
    if cached:
        return {
            "rate": cached["rate"],
            "source": cached["source"],
            "timestamp": cached["timestamp"],
            "cached": True,
        }

    errors: list[str] = []

    # 1. Try SBS Peru (only for USD/PEN or EUR/PEN pairs)
    if {from_ccy, to_ccy} <= {"USD", "EUR", "PEN"}:
        try:
            sbs = await fetch_sbs_rates()
            if from_ccy == "PEN" and to_ccy in ("USD", "EUR"):
                sell = sbs[to_ccy].get("sell")
                if sell:
                    rate = round(1.0 / float(sell), 6)
                    result = {"rate": rate, "source": "SBS Peru", "timestamp": sbs["timestamp"]}
                    _cache_set(cache_key, result)
                    return result
            elif to_ccy == "PEN" and from_ccy in ("USD", "EUR"):
                buy = sbs[from_ccy].get("buy")
                if buy:
                    rate = float(buy)
                    result = {"rate": rate, "source": "SBS Peru", "timestamp": sbs["timestamp"]}
                    _cache_set(cache_key, result)
                    return result
            elif from_ccy in ("USD", "EUR") and to_ccy in ("USD", "EUR"):
                # Cross via PEN
                buy_from = sbs[from_ccy].get("buy")
                sell_to = sbs[to_ccy].get("sell")
                if buy_from and sell_to:
                    rate = round(float(buy_from) / float(sell_to), 6)
                    result = {"rate": rate, "source": "SBS Peru (cross)", "timestamp": sbs["timestamp"]}
                    _cache_set(cache_key, result)
                    return result
        except Exception as e:
            errors.append(f"SBS: {e}")
            logger.warning("SBS API failed: %s", e)

    # 2. Try BCR Peru (USD/PEN only)
    if {from_ccy, to_ccy} == {"USD", "PEN"}:
        try:
            bcr = await fetch_bcr_rate()
            if from_ccy == "USD" and to_ccy == "PEN":
                rate = bcr["mid"]
            else:
                rate = round(1.0 / bcr["mid"], 6)
            ts = datetime.now(timezone.utc).isoformat()
            result = {"rate": rate, "source": "BCR Peru", "timestamp": ts}
            _cache_set(cache_key, result)
            return result
        except Exception as e:
            errors.append(f"BCR: {e}")
            logger.warning("BCR API failed: %s", e)

    # 3. ExchangeRate-API (all pairs)
    try:
        rates = await fetch_exchangerate_api(from_ccy)
        rate = rates.get(to_ccy)
        if rate is None:
            raise ValueError(f"No rate for {to_ccy}")
        ts = datetime.now(timezone.utc).isoformat()
        result = {"rate": float(rate), "source": "exchangerate-api.com", "timestamp": ts}
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        errors.append(f"ExchangeRate-API: {e}")
        logger.warning("ExchangeRate-API failed: %s", e)

    raise RuntimeError(f"All rate sources failed for {from_ccy}/{to_ccy}: {'; '.join(errors)}")


# ── WhatsApp formatting helpers ──────────────────────────────


def format_rate_whatsapp(from_ccy: str, to_ccy: str, rate: float, source: str, timestamp: str) -> str:
    return (
        f"💱 *{from_ccy} → {to_ccy}*\n"
        f"Tasa: *{rate:.4f}*\n"
        f"1 {from_ccy} = {rate:.4f} {to_ccy}\n"
        f"📡 Fuente: {source}\n"
        f"🕐 {timestamp}"
    )


def format_conversion_whatsapp(
    amount: float, from_ccy: str, to_ccy: str, converted: float, rate: float, source: str
) -> str:
    return (
        f"💰 *Conversión*\n"
        f"{amount:,.2f} {from_ccy} = *{converted:,.2f} {to_ccy}*\n"
        f"Tasa: {rate:.4f} ({source})"
    )


def format_sbs_whatsapp(sbs: dict[str, Any]) -> str:
    lines = [f"🏦 *Tipo de Cambio SBS*\n📅 {sbs['timestamp']}\n"]
    for ccy in ("USD", "EUR"):
        data = sbs.get(ccy, {})
        buy = data.get("buy")
        sell = data.get("sell")
        if buy is not None and sell is not None:
            lines.append(
                f"*{ccy}/PEN*\n"
                f"  Compra: S/ {float(buy):.4f}\n"
                f"  Venta:  S/ {float(sell):.4f}"
            )
    return "\n".join(lines)


# ── MCP Server ───────────────────────────────────────────────

mcp = FastMCP("forex-mcp")


def _validate_currency(code: str, param_name: str) -> str:
    code = code.upper().strip()
    if code not in SUPPORTED_CURRENCIES:
        raise ValueError(
            f"Unsupported currency '{code}' for {param_name}. "
            f"Supported: {', '.join(sorted(SUPPORTED_CURRENCIES))}"
        )
    return code


@mcp.tool(description="Get current exchange rate between two currencies with WhatsApp-formatted output.")
async def get_rate(from_currency: str, to_currency: str) -> str:
    """Get the current exchange rate between two currencies.

    Args:
        from_currency: Source currency code (e.g. USD, PEN, EUR, CNY, BRL, COP, MXN, GBP, JPY)
        to_currency: Target currency code
    """
    from_ccy = _validate_currency(from_currency, "from_currency")
    to_ccy = _validate_currency(to_currency, "to_currency")

    result = await get_rate_with_fallback(from_ccy, to_ccy)

    whatsapp = format_rate_whatsapp(from_ccy, to_ccy, result["rate"], result["source"], result["timestamp"])

    return (
        f"{whatsapp}\n\n"
        f"---\n"
        f"rate: {result['rate']}\n"
        f"inverse: {round(1.0 / result['rate'], 6)}\n"
        f"source: {result['source']}\n"
        f"cached: {result.get('cached', False)}"
    )


@mcp.tool(description="Convert an amount from one currency to another at the current exchange rate.")
async def convert(amount: float, from_currency: str, to_currency: str) -> str:
    """Convert an amount between currencies.

    Args:
        amount: Amount to convert
        from_currency: Source currency code
        to_currency: Target currency code
    """
    from_ccy = _validate_currency(from_currency, "from_currency")
    to_ccy = _validate_currency(to_currency, "to_currency")

    if amount <= 0:
        raise ValueError("Amount must be positive")

    result = await get_rate_with_fallback(from_ccy, to_ccy)
    converted = round(amount * result["rate"], 2)

    whatsapp = format_conversion_whatsapp(amount, from_ccy, to_ccy, converted, result["rate"], result["source"])

    return (
        f"{whatsapp}\n\n"
        f"---\n"
        f"from_amount: {amount}\n"
        f"to_amount: {converted}\n"
        f"rate: {result['rate']}\n"
        f"source: {result['source']}"
    )


@mcp.tool(description="Get historical exchange rate for a specific date (uses Frankfurter API).")
async def get_historical_rate(from_currency: str, to_currency: str, date: str) -> str:
    """Get the exchange rate for a specific past date.

    Args:
        from_currency: Source currency code
        to_currency: Target currency code
        date: Date in ISO format (YYYY-MM-DD)
    """
    from_ccy = _validate_currency(from_currency, "from_currency")
    to_ccy = _validate_currency(to_currency, "to_currency")

    # Validate date format
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise ValueError("Date must be in YYYY-MM-DD format")

    if parsed_date.date() >= datetime.now().date():
        raise ValueError("Date must be in the past")

    client = await get_client()
    url = f"https://api.frankfurter.dev/{date}?from={from_ccy}&to={to_ccy}"
    resp = await client.get(url)
    resp.raise_for_status()
    data = resp.json()

    rates = data.get("rates", {})
    rate = rates.get(to_ccy)

    if rate is None:
        raise ValueError(f"No historical rate for {from_ccy}/{to_ccy} on {date}")

    return (
        f"📅 *Tipo de cambio histórico*\n"
        f"Fecha: {date}\n"
        f"💱 1 {from_ccy} = *{rate:.4f} {to_ccy}*\n"
        f"📡 Fuente: Frankfurter (ECB)\n\n"
        f"---\n"
        f"rate: {rate}\n"
        f"date: {date}\n"
        f"source: Frankfurter (ECB data)"
    )


@mcp.tool(description="Get official SBS Peru buy/sell exchange rates for USD and EUR vs PEN.")
async def get_sbs_rates() -> str:
    """Get the official SBS Peru rates (buy/sell) for USD and EUR against PEN."""
    try:
        sbs = await fetch_sbs_rates()
        whatsapp = format_sbs_whatsapp(sbs)
        return (
            f"{whatsapp}\n\n"
            f"---\n"
            f"usd_buy: {sbs['USD'].get('buy')}\n"
            f"usd_sell: {sbs['USD'].get('sell')}\n"
            f"eur_buy: {sbs['EUR'].get('buy')}\n"
            f"eur_sell: {sbs['EUR'].get('sell')}\n"
            f"source: {sbs['source']}"
        )
    except Exception as e:
        logger.error("SBS rates fetch failed: %s", e)
        raise RuntimeError(f"Could not fetch SBS rates: {e}")


# ── Entrypoint ───────────────────────────────────────────────

def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
