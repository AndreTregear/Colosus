# ruff: noqa: B008
"""CRM MCP Server for Yaya Platform.

Provides contact management, interaction logging, customer history,
segmentation, and analytics tools over a PostgreSQL database.

All queries use parameterized SQL via psycopg to prevent injection.
Uses psycopg connection pooling for performance.
"""

import argparse
import asyncio
import json
import logging
import os
import signal
import sys
from typing import Any
from typing import Optional

import mcp.types as types
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from psycopg.rows import dict_row
from psycopg.sql import SQL
from psycopg.sql import Identifier
from psycopg.sql import Placeholder
from psycopg_pool import AsyncConnectionPool
from pydantic import Field

# ── Setup ─────────────────────────────────────────────────

mcp_server = FastMCP("crm-mcp")

logger = logging.getLogger(__name__)

SCHEMA = "business"

ResponseType = list[types.TextContent | types.ImageContent | types.EmbeddedResource]

shutdown_in_progress = False


# ── Connection Pool ───────────────────────────────────────

class CrmConnPool:
    """Async PostgreSQL connection pool wrapper."""

    def __init__(self) -> None:
        self.pool: AsyncConnectionPool | None = None
        self._url: str | None = None

    async def connect(self, url: str) -> None:
        self._url = url
        self.pool = AsyncConnectionPool(
            conninfo=url,
            min_size=1,
            max_size=5,
            open=False,
        )
        await self.pool.open()
        # Test connection
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        logger.info("CRM database connection pool established")

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def execute(
        self,
        query: str,
        params: list[Any] | None = None,
        *,
        fetch: bool = True,
    ) -> list[dict[str, Any]] | None:
        """Execute a parameterized query and return rows as dicts."""
        if not self.pool:
            raise RuntimeError("Database not connected")
        async with self.pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(query, params)
                if fetch and cur.description:
                    return [dict(r) for r in await cur.fetchall()]
                return None


db = CrmConnPool()


# ── Helpers ───────────────────────────────────────────────

def _text(data: Any) -> ResponseType:
    return [types.TextContent(type="text", text=str(data))]


def _json(data: Any) -> ResponseType:
    return [types.TextContent(type="text", text=json.dumps(data, default=str, ensure_ascii=False, indent=2))]


def _err(msg: str) -> ResponseType:
    return _text(f"Error: {msg}")


# ══════════════════════════════════════════════════════════
# CONTACT MANAGEMENT
# ══════════════════════════════════════════════════════════

@mcp_server.tool(
    description="Create a new contact in the CRM. Returns the created contact.",
    annotations=ToolAnnotations(title="Create Contact", destructiveHint=True),
)
async def create_contact(
    name: str = Field(description="Full name (will be split into first_name/last_name)"),
    phone: Optional[str] = Field(description="Phone number (e.g., +51999888777)", default=None),
    email: Optional[str] = Field(description="Email address", default=None),
    notes: Optional[str] = Field(description="Notes about this contact", default=None),
    company: Optional[str] = Field(description="Company name", default=None),
    tags: Optional[list[str]] = Field(description="Tags to assign", default=None),
    source: Optional[str] = Field(description="Lead source (whatsapp, website, referral, walk_in)", default=None),
) -> ResponseType:
    try:
        parts = name.strip().split(None, 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else None

        data: dict[str, Any] = {"first_name": first_name}
        if last_name:
            data["last_name"] = last_name
        if phone:
            data["phone"] = phone
        if email:
            data["email"] = email
        if notes:
            data["notes"] = notes
        if company:
            data["company"] = company
        if tags:
            data["tags"] = tags
        if source:
            data["source"] = source

        cols = list(data.keys())
        vals = list(data.values())
        q = SQL("INSERT INTO {}.contacts ({}) VALUES ({}) RETURNING *").format(
            Identifier(SCHEMA),
            SQL(", ").join(Identifier(c) for c in cols),
            SQL(", ").join(Placeholder() for _ in cols),
        ).as_string(None)
        rows = await db.execute(q, vals)
        return _json(rows[0] if rows else {})
    except Exception as e:
        logger.error(f"create_contact error: {e}")
        return _err(str(e))


@mcp_server.tool(
    description="Update an existing contact's information.",
    annotations=ToolAnnotations(title="Update Contact", destructiveHint=True),
)
async def update_contact(
    id: str = Field(description="Contact UUID"),
    first_name: Optional[str] = Field(description="Updated first name", default=None),
    last_name: Optional[str] = Field(description="Updated last name", default=None),
    phone: Optional[str] = Field(description="Updated phone", default=None),
    email: Optional[str] = Field(description="Updated email", default=None),
    company: Optional[str] = Field(description="Updated company", default=None),
    tags: Optional[list[str]] = Field(description="Replace all tags", default=None),
    notes: Optional[str] = Field(description="Updated notes", default=None),
    source: Optional[str] = Field(description="Updated source", default=None),
) -> ResponseType:
    try:
        fields: dict[str, Any] = {}
        if first_name is not None:
            fields["first_name"] = first_name
        if last_name is not None:
            fields["last_name"] = last_name
        if phone is not None:
            fields["phone"] = phone
        if email is not None:
            fields["email"] = email
        if company is not None:
            fields["company"] = company
        if tags is not None:
            fields["tags"] = tags
        if notes is not None:
            fields["notes"] = notes
        if source is not None:
            fields["source"] = source

        if not fields:
            return _err("No fields to update")

        params: list[Any] = []
        set_clauses = []
        for col, val in fields.items():
            set_clauses.append(SQL("{} = %s").format(Identifier(col)))
            params.append(val)
        params.append(id)

        q = SQL("UPDATE {}.contacts SET {} WHERE id = %s::uuid RETURNING *").format(
            Identifier(SCHEMA),
            SQL(", ").join(set_clauses),
        ).as_string(None)
        rows = await db.execute(q, params)
        if not rows:
            return _err(f"Contact {id} not found")
        return _json(rows[0])
    except Exception as e:
        logger.error(f"update_contact error: {e}")
        return _err(str(e))


@mcp_server.tool(
    description="Search contacts by name, phone, or email using fuzzy matching (trigram similarity). "
                "Returns matching contacts ranked by relevance.",
    annotations=ToolAnnotations(title="Search Contacts", readOnlyHint=True),
)
async def search_contacts(
    query: str = Field(description="Search term (matches name, phone, email)"),
    limit: int = Field(description="Max results", default=10),
) -> ResponseType:
    try:
        q = """
            SELECT *,
                   similarity(
                       coalesce(first_name, '') || ' ' || coalesce(last_name, ''),
                       %s
                   ) AS name_score
            FROM business.contacts
            WHERE coalesce(first_name, '') || ' ' || coalesce(last_name, '') %% %s
               OR phone ILIKE %s
               OR email ILIKE %s
            ORDER BY name_score DESC, created_at DESC
            LIMIT %s
        """
        like_pattern = f"%{query}%"
        rows = await db.execute(q, [query, query, like_pattern, like_pattern, limit])
        return _json(rows or [])
    except Exception as e:
        logger.error(f"search_contacts error: {e}")
        return _err(str(e))


@mcp_server.tool(
    description="List contacts with optional filters and pagination.",
    annotations=ToolAnnotations(title="List Contacts", readOnlyHint=True),
)
async def list_contacts(
    tag: Optional[str] = Field(description="Filter by tag", default=None),
    source: Optional[str] = Field(description="Filter by source", default=None),
    created_after: Optional[str] = Field(description="Filter: created after this date (YYYY-MM-DD)", default=None),
    created_before: Optional[str] = Field(description="Filter: created before this date (YYYY-MM-DD)", default=None),
    order_by: str = Field(description="Order column (created_at, first_name, last_name)", default="created_at"),
    order_dir: str = Field(description="ASC or DESC", default="DESC"),
    limit: int = Field(description="Max rows", default=50),
    offset: int = Field(description="Offset for pagination", default=0),
) -> ResponseType:
    try:
        parts = [SQL("SELECT * FROM business.contacts")]
        clauses: list[Any] = []
        params: list[Any] = []

        if tag:
            clauses.append(SQL("%s = ANY(tags)"))
            params.append(tag)
        if source:
            clauses.append(SQL("source = %s"))
            params.append(source)
        if created_after:
            clauses.append(SQL("created_at >= %s::timestamptz"))
            params.append(created_after)
        if created_before:
            clauses.append(SQL("created_at < %s::timestamptz"))
            params.append(created_before)

        if clauses:
            parts.append(SQL("WHERE ") + SQL(" AND ").join(clauses))

        # Validate order column
        allowed_order = {"created_at", "first_name", "last_name", "updated_at"}
        order_col = order_by if order_by in allowed_order else "created_at"
        direction = "DESC" if order_dir.upper() == "DESC" else "ASC"

        parts.append(SQL("ORDER BY {} " + direction).format(Identifier(order_col)))
        parts.append(SQL("LIMIT %s OFFSET %s"))
        params.extend([limit, offset])

        q = SQL(" ").join(parts).as_string(None)
        rows = await db.execute(q, params)
        return _json(rows or [])
    except Exception as e:
        logger.error(f"list_contacts error: {e}")
        return _err(str(e))


# ══════════════════════════════════════════════════════════
# INTERACTIONS
# ══════════════════════════════════════════════════════════

@mcp_server.tool(
    description="Log a customer interaction (call, message, purchase, complaint, etc.) against a contact.",
    annotations=ToolAnnotations(title="Log Interaction", destructiveHint=True),
)
async def log_interaction(
    contact_id: str = Field(description="Contact UUID"),
    type: str = Field(description="Interaction type: call, message, email, purchase, complaint, visit, note, appointment, payment, refund"),
    summary: str = Field(description="Description of the interaction"),
    metadata: Optional[dict[str, Any]] = Field(description="Additional structured data (e.g., order_id, amount)", default=None),
) -> ResponseType:
    try:
        data: dict[str, Any] = {
            "contact_id": contact_id,
            "type": type,
            "summary": summary,
        }
        if metadata:
            data["metadata"] = json.dumps(metadata)

        cols = list(data.keys())
        vals = list(data.values())
        q = SQL("INSERT INTO {}.interactions ({}) VALUES ({}) RETURNING *").format(
            Identifier(SCHEMA),
            SQL(", ").join(Identifier(c) for c in cols),
            SQL(", ").join(Placeholder() for _ in cols),
        ).as_string(None)
        rows = await db.execute(q, vals)
        return _json(rows[0] if rows else {})
    except Exception as e:
        logger.error(f"log_interaction error: {e}")
        return _err(str(e))


# ══════════════════════════════════════════════════════════
# CUSTOMER HISTORY & ANALYTICS
# ══════════════════════════════════════════════════════════

@mcp_server.tool(
    description="Get complete customer history: contact details, all interactions, "
                "orders/purchases, payments, appointments, and fiados.",
    annotations=ToolAnnotations(title="Get Customer History", readOnlyHint=True),
)
async def get_customer_history(
    contact_id: str = Field(description="Contact UUID"),
) -> ResponseType:
    try:
        # Contact details
        contact_rows = await db.execute(
            "SELECT * FROM business.contacts WHERE id = %s::uuid",
            [contact_id],
        )
        if not contact_rows:
            return _err(f"Contact {contact_id} not found")
        contact = contact_rows[0]

        # All interactions
        interactions = await db.execute(
            "SELECT * FROM business.interactions WHERE contact_id = %s::uuid ORDER BY created_at DESC",
            [contact_id],
        )

        # Appointments
        appointments = await db.execute(
            "SELECT * FROM business.appointments WHERE contact_id = %s::uuid ORDER BY start_time DESC",
            [contact_id],
        )

        # Payment validations
        payments = await db.execute(
            "SELECT * FROM business.payment_validations WHERE contact_id = %s::uuid ORDER BY created_at DESC",
            [contact_id],
        )

        # Fiados
        fiados = await db.execute(
            "SELECT * FROM business.fiados WHERE contact_id = %s::uuid ORDER BY created_at DESC",
            [contact_id],
        )

        # Deals
        deals = await db.execute(
            "SELECT * FROM business.deals WHERE contact_id = %s::uuid ORDER BY created_at DESC",
            [contact_id],
        )

        return _json({
            "contact": contact,
            "interactions": interactions or [],
            "appointments": appointments or [],
            "payments": payments or [],
            "fiados": fiados or [],
            "deals": deals or [],
        })
    except Exception as e:
        logger.error(f"get_customer_history error: {e}")
        return _err(str(e))


@mcp_server.tool(
    description="Get customer statistics: lifetime value, purchase frequency, "
                "last purchase date, interaction count, outstanding fiados, deal pipeline value.",
    annotations=ToolAnnotations(title="Get Customer Stats", readOnlyHint=True),
)
async def get_customer_stats(
    contact_id: str = Field(description="Contact UUID"),
) -> ResponseType:
    try:
        q = """
            WITH purchase_stats AS (
                SELECT
                    COUNT(*) AS purchase_count,
                    SUM((metadata->>'amount')::numeric) AS lifetime_value,
                    MAX(created_at) AS last_purchase
                FROM business.interactions
                WHERE contact_id = %s::uuid AND type = 'purchase'
            ),
            interaction_stats AS (
                SELECT
                    COUNT(*) AS total_interactions,
                    COUNT(DISTINCT type) AS interaction_types,
                    MIN(created_at) AS first_interaction,
                    MAX(created_at) AS last_interaction
                FROM business.interactions
                WHERE contact_id = %s::uuid
            ),
            fiado_stats AS (
                SELECT
                    COUNT(*) AS fiado_count,
                    COALESCE(SUM(amount - amount_paid) FILTER (WHERE status NOT IN ('paid', 'forgiven')), 0) AS outstanding_fiado
                FROM business.fiados
                WHERE contact_id = %s::uuid
            ),
            appointment_stats AS (
                SELECT
                    COUNT(*) AS total_appointments,
                    COUNT(*) FILTER (WHERE status = 'completed') AS completed_appointments,
                    COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
                FROM business.appointments
                WHERE contact_id = %s::uuid
            ),
            payment_stats AS (
                SELECT
                    COUNT(*) AS payment_count,
                    COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) AS total_paid
                FROM business.payment_validations
                WHERE contact_id = %s::uuid
            ),
            deal_stats AS (
                SELECT
                    COUNT(*) AS deal_count,
                    COALESCE(SUM(amount) FILTER (WHERE stage = 'won'), 0) AS won_value,
                    COALESCE(SUM(amount) FILTER (WHERE stage NOT IN ('won', 'lost')), 0) AS pipeline_value
                FROM business.deals
                WHERE contact_id = %s::uuid
            )
            SELECT
                ps.purchase_count,
                ps.lifetime_value,
                ps.last_purchase,
                ist.total_interactions,
                ist.interaction_types,
                ist.first_interaction,
                ist.last_interaction,
                fs.fiado_count,
                fs.outstanding_fiado,
                ast.total_appointments,
                ast.completed_appointments,
                ast.no_shows,
                pst.payment_count,
                pst.total_paid,
                ds.deal_count,
                ds.won_value,
                ds.pipeline_value
            FROM purchase_stats ps, interaction_stats ist, fiado_stats fs,
                 appointment_stats ast, payment_stats pst, deal_stats ds
        """
        params = [contact_id] * 6
        rows = await db.execute(q, params)

        # Also get contact info
        contact = await db.execute(
            "SELECT first_name, last_name, phone, email, tags, source FROM business.contacts WHERE id = %s::uuid",
            [contact_id],
        )

        result = rows[0] if rows else {}
        if contact:
            result["contact"] = contact[0]
        return _json(result)
    except Exception as e:
        logger.error(f"get_customer_stats error: {e}")
        return _err(str(e))


@mcp_server.tool(
    description="Segment customers based on criteria. Available segments: "
                "vip (high value), new (last 30 days), dormant (no interaction 90+ days), "
                "at_risk (no interaction 60-90 days), frequent (10+ interactions), "
                "debtors (outstanding fiados). "
                "Or provide custom SQL criteria.",
    annotations=ToolAnnotations(title="Segment Customers", readOnlyHint=True),
)
async def segment_customers(
    segment: str = Field(
        description="Segment name: vip, new, dormant, at_risk, frequent, debtors. "
                    "Or 'custom' with custom_where parameter."
    ),
    custom_where: Optional[str] = Field(
        description="Custom WHERE clause for 'custom' segment (applied to contacts table, alias c). "
                    "Use parameterized %s placeholders.",
        default=None,
    ),
    custom_params: Optional[list[Any]] = Field(description="Parameters for custom_where", default=None),
    limit: int = Field(description="Max contacts to return", default=100),
) -> ResponseType:
    try:
        segments: dict[str, str] = {
            "vip": """
                SELECT c.*, COALESCE(ps.lifetime_value, 0) AS lifetime_value
                FROM business.contacts c
                LEFT JOIN LATERAL (
                    SELECT SUM((metadata->>'amount')::numeric) AS lifetime_value
                    FROM business.interactions
                    WHERE contact_id = c.id AND type = 'purchase'
                ) ps ON true
                WHERE COALESCE(ps.lifetime_value, 0) > 0
                ORDER BY ps.lifetime_value DESC
                LIMIT %s
            """,
            "new": """
                SELECT * FROM business.contacts
                WHERE created_at >= now() - interval '30 days'
                ORDER BY created_at DESC
                LIMIT %s
            """,
            "dormant": """
                SELECT c.*,
                       MAX(i.created_at) AS last_interaction
                FROM business.contacts c
                LEFT JOIN business.interactions i ON i.contact_id = c.id
                GROUP BY c.id
                HAVING MAX(i.created_at) < now() - interval '90 days'
                    OR MAX(i.created_at) IS NULL
                ORDER BY last_interaction ASC NULLS FIRST
                LIMIT %s
            """,
            "at_risk": """
                SELECT c.*,
                       MAX(i.created_at) AS last_interaction
                FROM business.contacts c
                LEFT JOIN business.interactions i ON i.contact_id = c.id
                GROUP BY c.id
                HAVING MAX(i.created_at) BETWEEN now() - interval '90 days' AND now() - interval '60 days'
                ORDER BY last_interaction ASC
                LIMIT %s
            """,
            "frequent": """
                SELECT c.*, COUNT(i.id) AS interaction_count
                FROM business.contacts c
                JOIN business.interactions i ON i.contact_id = c.id
                GROUP BY c.id
                HAVING COUNT(i.id) >= 10
                ORDER BY interaction_count DESC
                LIMIT %s
            """,
            "debtors": """
                SELECT c.*,
                       SUM(f.amount - f.amount_paid) AS total_owed,
                       COUNT(f.id) AS fiado_count
                FROM business.contacts c
                JOIN business.fiados f ON f.contact_id = c.id
                WHERE f.status NOT IN ('paid', 'forgiven')
                GROUP BY c.id
                HAVING SUM(f.amount - f.amount_paid) > 0
                ORDER BY total_owed DESC
                LIMIT %s
            """,
        }

        if segment == "custom":
            if not custom_where:
                return _err("custom_where is required for 'custom' segment")
            # Only allow SELECT-safe patterns
            upper = custom_where.upper().strip()
            for kw in ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE"]:
                if kw in upper:
                    return _err(f"Keyword '{kw}' is not allowed in custom segment queries")
            q = f"SELECT c.* FROM business.contacts c WHERE {custom_where} ORDER BY c.created_at DESC LIMIT %s"
            params = (custom_params or []) + [limit]
        elif segment in segments:
            q = segments[segment]
            params = [limit]
        else:
            return _err(f"Unknown segment: {segment}. Available: {', '.join(sorted(segments.keys()))}, custom")

        rows = await db.execute(q, params)
        return _json({
            "segment": segment,
            "count": len(rows) if rows else 0,
            "contacts": rows or [],
        })
    except Exception as e:
        logger.error(f"segment_customers error: {e}")
        return _err(str(e))


@mcp_server.tool(
    description="Health check — verify database connectivity and schema existence.",
    annotations=ToolAnnotations(title="Health Check", readOnlyHint=True),
)
async def health_check() -> ResponseType:
    try:
        rows = await db.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = %s ORDER BY table_name",
            [SCHEMA],
        )
        tables = [r["table_name"] for r in rows] if rows else []
        return _json({
            "status": "connected",
            "schema": SCHEMA,
            "tables": tables,
            "table_count": len(tables),
        })
    except Exception as e:
        return _json({
            "status": "error",
            "error": str(e),
        })


# ══════════════════════════════════════════════════════════
# SERVER LIFECYCLE
# ══════════════════════════════════════════════════════════

async def main():
    parser = argparse.ArgumentParser(description="CRM MCP Server")
    parser.add_argument("database_url", help="Database connection URL", nargs="?")
    parser.add_argument(
        "--transport",
        type=str,
        choices=["stdio", "sse", "streamable-http"],
        default="stdio",
    )
    parser.add_argument("--host", type=str, default="localhost")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URI", args.database_url)
    if not database_url:
        raise ValueError(
            "No database URL provided. Set DATABASE_URI env var or pass as argument."
        )

    try:
        await db.connect(database_url)
    except Exception as e:
        logger.warning(f"Could not connect to database: {e}")
        logger.warning("Server will start but database operations will fail.")

    # Signal handling
    try:
        loop = asyncio.get_running_loop()
        for s in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(s, lambda s=s: asyncio.create_task(shutdown(s)))
    except NotImplementedError:
        pass

    if args.transport == "stdio":
        await mcp_server.run_stdio_async()
    elif args.transport == "sse":
        mcp_server.settings.host = args.host
        mcp_server.settings.port = args.port
        await mcp_server.run_sse_async()
    elif args.transport == "streamable-http":
        mcp_server.settings.host = args.host
        mcp_server.settings.port = args.port
        await mcp_server.run_streamable_http_async()


async def shutdown(sig=None):
    global shutdown_in_progress
    if shutdown_in_progress:
        sys.exit(1)
    shutdown_in_progress = True
    if sig:
        logger.info(f"Received signal {sig.name}")
    try:
        await db.close()
        logger.info("Closed database connections")
    except Exception as e:
        logger.error(f"Error closing connections: {e}")
    sys.exit(128 + sig if sig is not None else 0)
