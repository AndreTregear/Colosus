# Platform Cleanup Audit — 2026-03-21

## Executive Summary

Reduced `services/` from **949MB to 1.2MB** (99.87% reduction) by replacing 8 cloned open-source repos with slim Docker wrappers. Removed 1 dead MCP server. All 36 skills validated as non-redundant. Autobot kept (complementary to yape-listener, not redundant).

---

## 1. Services Audit

### Problem
8 out of 13 service directories contained **full cloned source code repos** of upstream open-source projects. We don't modify this source — we just run the Docker images.

### Actions Taken

| Service | Before | After | Action |
|---------|--------|-------|--------|
| calcom | 339MB | 16KB | Replaced with slim docker-compose.yml + .env.example + README.md |
| metabase | 319MB | 16KB | Replaced with slim docker-compose.yml + .env.example + README.md |
| karrio | 200MB | 16KB | Replaced with slim docker-compose.yml + .env.example + README.md |
| nemo-guardrails | 33MB | 20KB | Replaced with slim docker-compose.yml + .env.example + README.md |
| lago | 19MB | 16KB | Replaced with slim docker-compose.yml + .env.example + README.md |
| invoiceshelf | 16MB | 16KB | Replaced with slim docker-compose.yml + .env.example + README.md |
| crm | 13MB | 20KB | Replaced with Dockerfile (clones from upstream at build) + docker-compose.yml |
| easyappointments | 11MB | 16KB | Replaced with slim docker-compose.yml + .env.example + README.md |

### Kept As-Is (already lean)

| Service | Size | Reason |
|---------|------|--------|
| erpnext | 976KB | Config + Docker image definitions only |
| yape-listener | 44KB | Our own TypeScript service |
| tts | 24KB | Our own Kokoro TTS server |
| whisper | 8KB | Our Dockerfile config |
| vllm | 4KB | Placeholder directory |

**Total savings: ~948MB removed**

---

## 2. Skill Redundancy Audit

Investigated 5 potential redundancy areas across 36 skills. **Result: NO redundancies found.**

### yaya-fiados vs yaya-credit — DISTINCT
- **fiados:** Informal B2C credit tabs for bodegas (S/5–50, trust-based, warm reminders)
- **credit:** Formal B2B accounts receivable (S/500–50K+, invoices, credit scoring, late fees)
- Different user bases, scales, formality levels, and collection workflows

### yaya-ledger vs yaya-cash vs yaya-expenses — COMPLEMENTARY STACK
- **ledger:** Revenue tracking ("cuaderno de ventas" — how much did I sell today?)
- **cash:** Cash reconciliation (opening balance → end-of-day count → shortage investigation)
- **expenses:** Expense tracking + P&L calculation (revenue + expenses = profit)
- Together they form a complete simple accounting system: Revenue → Cash → Expenses

### yaya-bodega — ORCHESTRATOR, NOT DUPLICATE
- Meta-skill that delegates to yaya-ledger, yaya-cash, yaya-fiados, yaya-inventory, yaya-suppliers
- Adds bodega-specific features: merma tracking, distributor order templates, mobile recharges, utility payments, price lists, competitor awareness
- Optimized for bodeguera persona (low education, time-poor, voice-first)

### yaya-forecast vs yaya-analytics — COMPLEMENTARY
- **analytics:** PAST — historical performance reports and dashboards
- **forecast:** FUTURE — demand prediction and purchase planning
- Forecast reads analytics data to build models. No functional overlap.

### yaya-followup vs yaya-notifications — COMPLEMENTARY
- **followup:** Automatic 1:1 event-driven outreach (one customer, one event trigger)
- **notifications:** Owner-driven bulk/segmented campaigns (customer segments, batch sends)
- They coordinate to prevent over-messaging (daily limits, cooldowns)

---

## 3. Autobot Audit — KEPT

**Size:** 2.5MB | **Verdict:** Keep — complementary to yape-listener

| Aspect | Autobot | Yape-listener |
|--------|---------|---------------|
| Purpose | Full WhatsApp AI bot (Baileys) | Payment webhook receiver |
| AI | Full conversation + order actions | None |
| Orders | Complete lifecycle management | None |
| Products | Per-tenant catalog | None |
| Payments | Sends Yape instructions | Receives & matches payments |
| Size | 2.5MB | 44KB |

They're complementary: autobot is the active agent, yape-listener is the passive receiver.

---

## 4. MCP Server Audit

### Removed
- **yape-mcp** (16KB) — 0 skill references. Functionality subsumed by payments-mcp + yape-listener.

### Kept (all actively referenced)

| Server | Skills Using | Role |
|--------|-------------|------|
| postgres-mcp | 33 | Query builder, index tuning, safe SQL |
| erpnext-mcp | 26 | Products, orders, invoices, stock |
| crm-mcp | 22 | Contacts, deals, interactions, segments |
| whatsapp-mcp | 17 | Outbound WhatsApp messaging |
| lago-mcp | 5 | Subscriptions, metered billing |
| invoicing-mcp | 4 | Multi-country e-invoicing (APISUNAT, Facturapi, MATIAS) |
| forex-mcp | 4 | Exchange rates, import cost calculations |
| appointments-mcp | 2 | Booking, calendar sync, Cal.com bridge |
| payments-mcp | 2 | Payment validation, matching, refunds |
| voice-mcp | 1 | Whisper STT + Kokoro TTS pipeline |

### Key Clarifications
- **appointments-mcp vs Cal.com:** Cal.com is a bridge *within* appointments-mcp, not a replacement
- **invoicing-mcp vs apisunat.pe:** apisunat.pe is an adapter *within* invoicing-mcp for Peru
- **payments-mcp vs yape-mcp:** payments-mcp handles all payment types; yape-mcp was redundant

---

## 5. Research & Tests — KEPT

- **Research:** 87 docs, 2.1MB — valuable reference covering market, competitive, regulatory, technical domains
- **Tests:** 77 files, 2.0MB — 7 PMF evaluation rounds with 31 personas. Cumulative data, all rounds valuable for baselines
- **Android:** 1.5MB — YapeReader payment interceptor app. Production-grade, critical for payment flow.

---

## Final Tally

| Category | Before | After | Change |
|----------|--------|-------|--------|
| services/ | 949MB | 1.2MB | -948MB (99.87%) |
| MCP servers | 11 | 10 | -1 (yape-mcp removed) |
| Skills | 36 | 36 | No change (no redundancy found) |
| Autobot | 2.5MB | 2.5MB | Kept (complementary) |
| Research | 2.1MB | 2.1MB | Kept (valuable reference) |
| Tests | 2.0MB | 2.0MB | Kept (cumulative PMF data) |
