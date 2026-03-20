# Yaya Platform Test Harness

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Test Orchestrator (this agent)                  │
│  ├── Loads persona from personas/*.md            │
│  ├── Spawns roleplay subagent (the customer)     │
│  ├── Spawns evaluator subagent (the judge)       │
│  └── Collects results to results/*.md            │
└────────────┬────────────────┬───────────────────┘
             │                │
      ┌──────▼──────┐ ┌──────▼──────┐
      │  Roleplay   │ │  Evaluator  │
      │  Agent      │ │  Agent      │
      │             │ │             │
      │  Acts as    │ │  Grades:    │
      │  Carlos,    │ │  - Handled? │
      │  sends      │ │  - Quality  │
      │  messages   │ │  - Speed    │
      │  via WA     │ │  - Accuracy │
      └─────────────┘ └─────────────┘
```

## Test Flow

1. **Load persona** — Read persona file for context, scenarios, and expectations
2. **For each scenario:**
   a. Roleplay agent generates realistic WhatsApp message (in character)
   b. Message is evaluated against skill capabilities
   c. Evaluator grades: Could Yaya handle this? How well? What's missing?
3. **Generate report** — Coverage matrix, gaps, recommendations

## Evaluation Criteria

### Per Scenario Scoring (0-10)

| Dimension | Description |
|-----------|-------------|
| **Handleable** | Can the current skill set + MCP tools handle this request? (0=impossible, 10=trivially) |
| **Accuracy** | Would the response be factually correct given the tools available? |
| **Speed** | Can this be resolved in one exchange or does it require multiple turns? |
| **Completeness** | Does the response fully address the need or just partially? |
| **Delight** | Would Carlos be impressed or just satisfied? |
| **Safety** | Any risk of wrong info, data leak, or customer harm? |

### Coverage Categories

- ✅ **FULLY COVERED** — Skill + MCP tool exists, handles this well
- ⚠️ **PARTIALLY COVERED** — Can help but gaps exist
- ❌ **NOT COVERED** — No skill or tool for this, needs building
- 🔄 **NEEDS ESCALATION** — Should hand off to human (and skill handles it)

## Adding New Personas

Create a new file in `personas/` following the same structure:
- Profile (demographics, business, communication style)
- Daily/Weekly/Monthly tasks
- Pain points
- Test scenarios with expected behavior

Persona ideas for future testing:
- **María Elena** — Hair salon owner, Lima, service-based, appointment-heavy
- **Roberto Huamán** — Restaurant owner, Cusco, delivery + dine-in, tourist customers
- **Diana Vargas** — Online clothing boutique, Instagram + WhatsApp, fashion/dropship
- **Jorge Castillo** — Hardware store owner, Arequipa, B2B + retail, invoice-heavy
- **Lucía Chen** — Peruvian-Chinese, bilingual, wholesale electronics, Jirón de la Unión
