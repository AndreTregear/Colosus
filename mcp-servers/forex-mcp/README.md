# forex-mcp — Exchange Rate Service

Real-time and historical exchange rates for the Yaya Platform, with Peru-specific official sources (SBS, BCR) and WhatsApp-formatted output.

## Why

14/20 test personas need currency conversion (multi-country LATAM commerce). This server provides accurate, official rates with a fallback chain so the agent never fails on a forex query.

## Architecture

Two implementations coexist:
- **`server.py` (Python)** — Primary. SBS/BCR Peru official rates, fallback chain, WhatsApp formatting, 15-min cache.
- **`src/index.ts` (TypeScript)** — Complementary. Basic conversion, historical ranges, IGV calculation, landed cost for imports.

Use the Python server for customer-facing rate queries and the TypeScript server for import cost calculations.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run
python server.py

# Or with uv
uv pip install -r requirements.txt
uv run server.py
```

No API keys required — all data sources are free/public.

## MCP Tools

### Python server (`server.py`)

| Tool | Description |
|------|-------------|
| `get_rate(from_currency, to_currency)` | Current rate + timestamp. Fallback chain: SBS → BCR → exchangerate-api.com |
| `convert(amount, from_currency, to_currency)` | Convert amount at current rate |
| `get_historical_rate(from_currency, to_currency, date)` | Rate for a specific past date (Frankfurter/ECB) |
| `get_sbs_rates()` | Official SBS Peru buy/sell rates for USD and EUR vs PEN |

### TypeScript server (`src/index.ts`)

| Tool | Description |
|------|-------------|
| `get_exchange_rate(from, to)` | Current rate via ExchangeRate-API |
| `convert_amount(amount, from, to)` | Amount conversion |
| `get_rate_history(from, to, start_date, end_date)` | Historical range with min/max/avg stats |
| `calculate_igv(amount, currency?)` | Peru IGV (18%) calculation |
| `calculate_landed_cost(fob_price, ...)` | Full CIF + duties + IGV landed cost for Peru imports |

## Supported Currencies

PEN, USD, EUR, CNY, BRL, COP, MXN, GBP, JPY

## Data Sources & Fallback Chain

1. **SBS Peru** (`apis.net.pe/v2/sbs/tipo-cambio`) — Official buy/sell rates for USD/PEN and EUR/PEN
2. **BCR Peru** (`estadisticas.bcrp.gob.pe`) — Central bank reference rates for USD/PEN
3. **ExchangeRate-API** (`open.er-api.com`) — Free tier, all currency pairs, no key needed
4. **Frankfurter** (`api.frankfurter.dev`) — Historical rates from ECB data

For USD/PEN and EUR/PEN pairs, SBS is tried first (most accurate for Peru commerce). For all other pairs, ExchangeRate-API is used directly.

## Caching

All rates are cached for **15 minutes** to avoid rate limiting and reduce latency. SBS rates are cached separately.

## WhatsApp Output Format

All tools return dual-format output:
- **Top section**: WhatsApp-ready formatted text with emojis, ready to send to customers
- **Bottom section** (after `---`): Machine-readable key-value pairs for programmatic use

Example:
```
💱 *USD → PEN*
Tasa: *3.7250*
1 USD = 3.7250 PEN
📡 Fuente: SBS Peru
🕐 2026-03-21T15:30:00+00:00

---
rate: 3.725
inverse: 0.268456
source: SBS Peru
cached: False
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `FOREX_API_URL` | `https://open.er-api.com/v6/latest` | ExchangeRate-API base URL (TypeScript server) |

## Error Handling

- Each source in the fallback chain is tried in order; failures are logged and the next source is attempted
- If all sources fail, a clear error message lists which sources were tried and why each failed
- Invalid currency codes return a helpful error listing supported currencies
- Negative/zero amounts are rejected
- Future dates are rejected for historical queries

## Integration

This server is used by:
- **yaya-expenses** — Currency conversion for multi-currency expense tracking
- **yaya-payments** — Rate display when customers pay in different currencies
- **yaya-commerce** — Product pricing across LATAM markets
