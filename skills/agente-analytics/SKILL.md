# agente-analytics — Business Intelligence & Reporting

## Description
Generates business intelligence reports and insights from sales, customer, inventory, and operational data. Provides daily/weekly/monthly summaries, top products, customer acquisition metrics, revenue trends, and payment collection rates. Reports are delivered via WhatsApp on demand or via scheduled cron — formatted with bullet lists and emojis because WhatsApp doesn't render markdown tables.

## When to Use
- Business owner asks "¿cómo van las ventas?" or any performance question
- A scheduled report triggers via cron (daily summary, weekly report, monthly review)
- Business owner wants to compare periods ("this month vs last month")
- Specific metric queries ("¿cuál es mi producto más vendido?", "¿cuántos clientes nuevos tengo?")
- Business owner needs data to make decisions (reorder, pricing, staffing)
- End of day/week/month summary

## Capabilities
- **Sales Reports** — Revenue, order count, average order value, by period
- **Product Performance** — Top sellers, slow movers, margin analysis
- **Customer Metrics** — New vs returning, acquisition rate, retention, lifetime value
- **Payment Analytics** — Collection rate, payment method breakdown, overdue amounts
- **Inventory Insights** — Stock turnover, dead stock, reorder efficiency
- **Trend Analysis** — Compare current period vs previous (day/week/month/year)
- **Conversion Metrics** — Inquiry-to-order rate, cart abandonment rate
- **Agent Performance** — Conversations handled, escalation rate, resolution rate, response time
- **Appointment Metrics** — Bookings, no-show rate, utilization per provider (for service businesses)
- **Custom Queries** — Business owner can ask ad-hoc questions about their data

## MCP Tools Required
- `erpnext-mcp` — Sales orders, revenue, product data, payment entries
- `crm-mcp` — Customer counts, segments, interaction volumes
- `postgres-mcp` — Complex aggregations, trend calculations, cross-system joins
- `lago-mcp` — Platform usage metrics (for Agente team internal analytics)

## Report Schedules (via OpenClaw Cron)

```yaml
scheduled_reports:
  daily_summary:
    schedule: "0 21 * * *"        # Every day at 9 PM
    description: "End of day sales and activity summary"

  weekly_report:
    schedule: "0 10 * * 1"        # Monday at 10 AM
    description: "Previous week performance review"

  monthly_review:
    schedule: "0 10 1 * *"        # 1st of month at 10 AM
    description: "Previous month comprehensive review"

  realtime_alerts:
    schedule: "*/15 * * * *"      # Every 15 minutes
    description: "Check for notable events (big sale, milestone)"
```

## Behavior Guidelines
- **WhatsApp-first formatting.** No markdown tables — WhatsApp doesn't render them. Use bullet lists, emojis as visual markers, and line breaks for readability.
- **Lead with the headline.** Start every report with the most important number or insight before the details.
- **Compare to context.** Raw numbers mean nothing. "S/2,450 en ventas" is less useful than "S/2,450 en ventas — 12% más que la semana pasada."
- **Keep it scannable.** Business owners look at reports on their phone while doing other things. Short, punchy, hierarchical.
- **Explain anomalies.** If a number is unusually high or low, try to explain why (if data supports it).
- **Don't overwhelm.** Daily reports should be 5-10 lines. Weekly reports 15-20 lines. Monthly can be longer but still focused.
- **Actionable insights.** End reports with 1-2 specific recommendations when possible.
- **Positive framing.** Lead with wins. Address problems as opportunities.
- **Round numbers.** S/2,847.33 → S/2,847. Percentages to one decimal.

## Report Formats

### Daily Summary (End of Day)
```
📊 Resumen del día — Miércoles 20/03

💰 Ventas: S/1,234 (8 pedidos)
   ↗️ +15% vs promedio diario

🏆 Más vendido: Air Max 90 (3 pares)

👥 Clientes:
   • 5 conversaciones atendidas
   • 2 clientes nuevos
   • 1 escalación (resuelta)

💳 Cobros:
   • 6 pagos confirmados (S/987)
   • 2 pagos pendientes (S/247)

✅ Todo al día. ¡Buen trabajo! 💪
```

### Weekly Report
```
📊 Reporte semanal — 14 al 20 de marzo

💰 VENTAS
   • Total: S/8,450 (52 pedidos)
   • Promedio diario: S/1,207
   • vs semana anterior: ↗️ +8%
   • Ticket promedio: S/162

🏆 TOP PRODUCTOS
   1. Air Max 90 — 12 pares — S/3,588
   2. Revolution 6 — 8 pares — S/1,592
   3. Havaianas Top — 15 pares — S/585
   4. Court Vision — 5 pares — S/1,245
   5. Adidas Gazelle — 4 pares — S/1,036

👥 CLIENTES
   • Conversaciones: 89
   • Clientes nuevos: 14
   • Tasa de conversión: 58%
   • Escalaciones: 3 (todas resueltas)

💳 COBROS
   • Cobrado: S/7,890 (93%)
   • Pendiente: S/560 (3 pedidos)
   • Método más usado: Yape (67%)

📦 INVENTARIO
   • ⚠️ 3 productos en stock bajo
   • ❌ 1 producto agotado (Superstar 39)

💡 INSIGHTS
   • Los martes y jueves son tus días más fuertes
   • 4 clientes preguntaron por Superstar 39 — reponerlas es prioridad
   • El ticket promedio subió S/12 vs semana anterior 📈
```

### Monthly Review
```
📊 Reporte mensual — Febrero 2026

💰 RESUMEN FINANCIERO
   • Ingresos: S/34,200
   • vs mes anterior: ↗️ +12%
   • vs mismo mes 2025: ↗️ +45%
   • Pedidos: 210
   • Ticket promedio: S/163

📈 TENDENCIA DE VENTAS
   • Semana 1: S/7,800
   • Semana 2: S/8,100 ↗️
   • Semana 3: S/9,200 ↗️
   • Semana 4: S/9,100 →
   • Tendencia: crecimiento sostenido 💪

👥 CLIENTES
   • Total activos: 189
   • Nuevos este mes: 52
   • Retención: 78%
   • NPS estimado: 4.2/5 ⭐

   Por segmento:
   • 💎 VIP: 23 (gastan S/1,450/mes promedio)
   • 👥 Regulares: 89
   • 🆕 Nuevos: 52
   • ⚠️ En riesgo: 15
   • 😴 Dormidos: 10

💳 COBROS
   • Tasa de cobro: 94%
   • Yape: 65% de pagos
   • Plin: 20%
   • Transferencia: 15%
   • Morosidad promedio: 1.8 días

🤖 RENDIMIENTO DEL AGENTE
   • Conversaciones: 412
   • Resueltas sin escalación: 94%
   • Tiempo promedio de respuesta: 8 segundos
   • Escalaciones: 24 (6%)
   • Satisfacción post-compra: 4.3/5

💡 RECOMENDACIONES
   1. Las Superstar 39 tuvieron 18 consultas. Duplicar el pedido habitual.
   2. Los viernes son el día más flojo — considerar una promo de fin de semana.
   3. 15 clientes en riesgo — activar campaña de re-engagement.
```

## Example Flows

### On-Demand Query
```
Dueño: "¿Cuánto vendí hoy?"
Agente: [consulta ERPNext + postgres]
Agente: "💰 Hoy llevas S/1,567 en 9 pedidos.
         Ayer a esta hora ibas en S/1,200 — vas un 30% arriba 📈

         ¿Quieres ver el detalle?"
```

### Comparison Query
```
Dueño: "¿Cómo va marzo comparado con febrero?"
Agente: [consulta ERPNext + postgres]
Agente: "📊 Marzo vs Febrero (hasta hoy, día 20):

         💰 Ventas: S/28,400 vs S/24,100 — ↗️ +18%
         📦 Pedidos: 172 vs 148 — ↗️ +16%
         👥 Clientes nuevos: 41 vs 35 — ↗️ +17%
         💳 Tasa de cobro: 95% vs 92% — ↗️ mejor

         A este ritmo, marzo cerraría en ~S/42,600.
         Sería tu mejor mes del año 🏆"
```

### Specific Product Performance
```
Dueño: "¿Cómo van las Air Max 90?"
Agente: "👟 Air Max 90 — Performance del mes:

         📦 Vendidos: 28 pares
         💰 Ingresos: S/8,372
         📊 Promedio: ~1.4 pares/día
         📈 vs mes anterior: +22%

         Por talla:
         • 40: 4 pares
         • 41: 6 pares (⭐ más vendida)
         • 42: 8 pares (⭐ más vendida)
         • 43: 5 pares
         • 44: 3 pares
         • 45: 2 pares

         Stock actual: 18 pares (~13 días al ritmo actual)
         ⚠️ Recomendación: reponer tallas 41 y 42 pronto"
```

### Ad-Hoc Question
```
Dueño: "¿Cuál es mi mejor día de la semana?"
Agente: [analiza datos de los últimos 3 meses]
Agente: "📊 Ventas promedio por día (últimos 3 meses):

         1. 🏆 Jueves — S/1,890/día
         2. Martes — S/1,720/día
         3. Sábado — S/1,650/día
         4. Miércoles — S/1,480/día
         5. Lunes — S/1,350/día
         6. Viernes — S/1,200/día
         7. Domingo — S/890/día

         Los jueves y martes son tus días fuertes.
         ¿Quieres aprovechar el viernes con alguna promo? 💡"
```

## Configuration
- `ANALYTICS_DAILY_REPORT_TIME` — Time to send daily summary (default: "21:00")
- `ANALYTICS_WEEKLY_REPORT_DAY` — Day for weekly report, 0=Mon (default: 1, Monday)
- `ANALYTICS_REPORT_CONTACTS` — WhatsApp numbers to receive reports (comma-separated)
- `ANALYTICS_CURRENCY` — Currency for report formatting (default: from BUSINESS_CURRENCY)
- `ANALYTICS_COMPARISON_ENABLED` — Include period-over-period comparisons (default: true)
- `ANALYTICS_INSIGHTS_ENABLED` — Include AI-generated insights and recommendations (default: true)
- `ANALYTICS_MILESTONE_ALERTS` — Notify on milestones: daily revenue record, Nth customer, etc. (default: true)
- `BUSINESS_TIMEZONE` — Timezone for report periods (e.g., "America/Lima")

## Error Handling & Edge Cases
- **Insufficient data:** If the business is new and doesn't have enough data for comparisons or trends, say so honestly: "Todavía no tenemos suficientes datos para comparar con el mes pasado. ¡Empezamos a medir desde ahora!"
- **Data inconsistency:** If numbers from ERPNext and CRM don't match (e.g., order count vs interaction count), use ERPNext as the source of truth for financial data and CRM for customer data.
- **Zero sales day:** Don't make it feel bad. "Hoy fue un día tranquilo — 0 pedidos. Los domingos suelen ser así. ¡Mañana viene con todo! 💪"
- **Report delivery failure:** If the WhatsApp message fails (too long, delivery error), split the report into smaller messages. WhatsApp has a ~4096 character limit per message.
- **Time zone edge cases:** "Today's sales" always means the business's local timezone, not UTC.
- **Holiday/seasonal distortion:** When comparing periods, note if one period included a holiday or seasonal event that would skew the comparison.
- **Large catalogs:** For businesses with 1000+ products, limit "top products" reports to top 10 instead of showing everything. Offer to drill down by category.
- **Privacy in reports:** Never include customer names or phone numbers in reports sent via WhatsApp. Use counts and segments only. If the owner wants specifics, they should ask individually.
