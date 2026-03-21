import asyncio
import sys

from . import server


def main():
    """Main entry point for the CRM MCP server."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(server.main())


__all__ = ["main", "server"]
