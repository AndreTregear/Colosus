/**
 * NLU Agent — LLM-backed extraction of structured transaction data
 * from transcribed Spanish voice text.
 *
 * Uses generateObject (Vercel AI SDK) for structured output — the LLM returns
 * a typed JSON object matching our Zod schema. No tool calling overhead.
 *
 * Strategy:
 *   1. Regex pre-filter: if no financial keywords detected, return null fast
 *   2. LLM extraction: small prompt + structured output schema
 *   3. Regex validation: cross-check LLM output against regex extractors
 *
 * Latency budget: <800ms on local vLLM (qwen3.5-35b-a3b)
 */
import { logger } from '../shared/logger.js';
import {
  extractAmount,
  extractDate,
  extractTransaction as regexExtract,
  type StructuredTransaction,
  type ExtractedAmount,
  type ExtractedDate,
  type TransactionType,
} from './nlu-extractor.js';

// ── LLM extraction via raw chat completion (fast path, no constrained decoding) ──
// Uses HPC 122B when available (better at colloquial Spanish), falls back to local 35B.

import { ensureHealthy } from '../ai/model-router.js';

const LOCAL_URL = process.env.YAYA_LLM_URL || process.env.VLLM_API_BASE || 'http://localhost:8000/v1';
const LOCAL_KEY = process.env.YAYA_LLM_KEY || process.env.VLLM_API_KEY || process.env.AI_API_KEY || '';
const LOCAL_MODEL = process.env.YAYA_LLM_MODEL || process.env.VLLM_MODEL || 'cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit';

const HPC_URL = process.env.HPC_API_BASE || 'http://localhost:18080/v1';
const HPC_KEY = process.env.HPC_API_KEY || LOCAL_KEY;
const HPC_MODEL = process.env.HPC_MODEL || 'qwen3.5-122b';

interface LLMTransaction {
  type: 'sale' | 'expense' | 'payment_received' | 'payment_sent' | 'none';
  amount: number | null;
  currency: string;
  category: string | null;
  vendor: string | null;
  date: string | null;
  description: string | null;
}

// ── Financial keyword pre-filter ──

const FINANCIAL_KEYWORDS = /(?:vend[ií]|cobr[eé]|gast[eé]|compr[eé]|pagu[eé]|recib[ií]|deposit[eé]|transfer[ií]|factur|invert[ií]|soles?|dolar|pesos?|s\/|me\s+pag|me\s+dieron|venta|gasto|compra|ingreso|pago|fiado|cuota|deuda|credito|lucas?|luca|yape|mercader[ií]a|salió|caro|barato|costó|cobr[eé]|fi[eé])/i;

const AMOUNT_HINT = /\d+(?:[.,]\d{1,2})?|\b(?:mil|cien|ciento|doscientos|trescientos|quinientos|cincuenta|veinte|treinta|cuarenta|sesenta|setenta|ochenta|noventa|veinticinco)\b/i;

/**
 * Fast check: does this text look like it contains financial data?
 * Avoids wasting an LLM call on "hola como estas" or "qué hora es".
 * Intentionally permissive — false positives are cheap (one LLM call),
 * false negatives lose financial data.
 */
function looksFinancial(text: string): boolean {
  return FINANCIAL_KEYWORDS.test(text) || AMOUNT_HINT.test(text);
}

// ── Main extraction function ──

/**
 * Extract a structured transaction from Spanish voice text using LLM.
 *
 * Returns null for non-financial text (fast path, no LLM call).
 * Falls back to regex extraction if LLM fails.
 */
export async function extractTransactionWithAgent(
  text: string,
  referenceDate?: Date,
): Promise<StructuredTransaction | null> {
  // Fast path: skip LLM for clearly non-financial text
  if (!looksFinancial(text)) {
    return null;
  }

  const now = referenceDate ?? new Date();
  const todayStr = now.toISOString().split('T')[0];

  const messages = [
    {
      role: 'system',
      content: `Extrae datos financieros. Responde SOLO JSON. "luca"=1000 PEN. Hoy: ${todayStr}. Categorías: food,utilities,transport,rent,salary,supplies,services,taxes,marketing,health,insurance,office,finance. /no_think`,
    },
    {
      role: 'user',
      content: `{"texto":"${text.replace(/"/g, '\\"')}"}\nResponde: {"type":"sale|expense|payment_received|payment_sent|none","amount":NUMBER|null,"currency":"PEN","category":"..."|null,"vendor":"..."|null,"date":"YYYY-MM-DD"|null,"description":"..."}`,
    },
  ];

  // Try HPC first (122B better at colloquial Spanish), fall back to local
  const endpoints = await ensureHealthy('hpc')
    ? [{ url: HPC_URL, key: HPC_KEY, model: HPC_MODEL }, { url: LOCAL_URL, key: LOCAL_KEY, model: LOCAL_MODEL }]
    : [{ url: LOCAL_URL, key: LOCAL_KEY, model: LOCAL_MODEL }];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${ep.url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ep.key}`,
        },
        body: JSON.stringify({
          model: ep.model,
          messages,
          max_tokens: 120,
          temperature: 0,
          stream: false,
          chat_template_kwargs: { enable_thinking: false },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`vLLM ${res.status}`);

      const data = await res.json() as any;
      const content: string = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const object = JSON.parse(jsonMatch[0]) as LLMTransaction;

      if (object.type === 'none' && object.amount === null) {
        return null;
      }

      logger.debug({ backend: ep.model }, 'NLU extraction via LLM');
      return llmToStructured(object, text, now);
    } catch (err) {
      logger.warn({ err: err instanceof Error ? err.message : err, backend: ep.model }, 'NLU LLM failed, trying next');
    }
  }

  // All LLM backends failed — fall back to regex
  logger.warn('All NLU LLM backends failed, falling back to regex');
  const regexResult = regexExtract(text, referenceDate);
  return (regexResult.amount !== null || regexResult.type !== 'unknown') ? regexResult : null;
}

// ── Category normalization (BUG-005 fix) ──
// Ensures consistent categories regardless of which model (35B vs 122B) produced them.

/** Synonym map: non-canonical → canonical */
const CATEGORY_SYNONYMS: Record<string, string> = {
  inventory: 'supplies',
  goods: 'supplies',
  merchandise: 'supplies',
  mercadería: 'supplies',
  productos: 'supplies',
  groceries: 'food',
  comida: 'food',
  alimentos: 'food',
  transportation: 'transport',
  transporte: 'transport',
  salario: 'salary',
  sueldo: 'salary',
  servicios: 'services',
  impuestos: 'taxes',
  salud: 'health',
  seguro: 'insurance',
  oficina: 'office',
  finanzas: 'finance',
  alquiler: 'rent',
  renta: 'rent',
};

/** Food-related keywords — items that are edible products */
const FOOD_ITEMS = /\b(?:arroz|aceite|pollo|carne|pescado|verdura|fruta|huevo|leche|pan|azúcar|azucar|sal|harina|fideos?|papa|tomate|cebolla|ajo|ceviche|empanada|comida|almuerzo|desayuno|cena|menú|menu)\b/i;

/**
 * Normalize a category to ensure consistency across models.
 *
 * Rules:
 * 1. Apply synonym mapping (inventory → supplies, goods → supplies, etc.)
 * 2. For sale/payment_received transactions with food items: category → "food"
 *    (selling food = revenue from food)
 * 3. For expense transactions with food items: category → "supplies"
 *    (buying food items to resell = purchasing supplies)
 * 4. If result is already canonical, keep it.
 */
function normalizeCategory(
  category: string | null,
  type: TransactionType,
  rawText: string,
): string | null {
  if (!category) return null;

  const lower = category.toLowerCase().trim();

  // Step 1: apply synonym mapping
  let normalized = CATEGORY_SYNONYMS[lower] ?? lower;

  // Step 2: context-aware normalization for food-related items
  if (FOOD_ITEMS.test(rawText)) {
    if (type === 'sale' || type === 'payment_received') {
      // Selling food items → categorize as "food" (revenue)
      normalized = 'food';
    } else if (type === 'expense' && normalized === 'supplies') {
      // LLM said inventory/goods (now mapped to supplies) for a food item expense →
      // keep as "supplies" (buying food to resell = cost of goods).
      // If LLM said "food" for an expense, respect it (personal consumption).
      normalized = 'supplies';
    }
  }

  // Step 3: if still not canonical, keep the model's value (don't discard unknown categories)
  return normalized;
}

// ── Convert LLM output to StructuredTransaction ──

function llmToStructured(
  llm: LLMTransaction,
  rawText: string,
  referenceDate: Date,
): StructuredTransaction {
  const extractedFields: string[] = [];

  // Type
  const type: TransactionType = llm.type === 'none' ? 'unknown' : llm.type;
  if (type !== 'unknown') extractedFields.push('type');

  // Amount — cross-validate with regex
  let amount: ExtractedAmount | null = null;
  if (llm.amount !== null && llm.amount > 0) {
    const regexAmount = extractAmount(rawText);
    const currencySymbol = llm.currency === 'PEN' ? 'S/' : llm.currency === 'USD' ? '$' : llm.currency === 'BRL' ? 'R$' : '$';

    // If regex agrees on amount, high confidence. If only LLM found it, medium.
    const confidence = regexAmount && Math.abs(regexAmount.value - llm.amount) < 0.01
      ? 0.95
      : regexAmount
        ? 0.80 // regex found different amount — trust LLM but lower confidence
        : 0.85; // only LLM found it

    amount = {
      value: llm.amount,
      currency: llm.currency,
      currencySymbol,
      confidence,
    };
    extractedFields.push('amount');
  }

  // Category — normalize to canonical set (BUG-005)
  const category = normalizeCategory(llm.category || null, type, rawText);
  if (category) extractedFields.push('category');

  // Vendor
  const vendor = llm.vendor || null;
  if (vendor) extractedFields.push('vendor');

  // Date — try regex first (more reliable for relative dates), fall back to LLM
  let date: ExtractedDate | null = null;
  const regexDate = extractDate(rawText, referenceDate);
  if (regexDate) {
    date = regexDate;
    extractedFields.push('date');
  } else if (llm.date) {
    try {
      const parsed = new Date(llm.date + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        date = { date: parsed, original: llm.date, isRelative: false, confidence: 0.85 };
        extractedFields.push('date');
      }
    } catch { /* invalid date from LLM — skip */ }
  }

  // Description
  const description = llm.description || rawText.trim() || null;

  // Overall confidence
  const confidences: number[] = [];
  if (type !== 'unknown') confidences.push(0.90);
  if (amount) confidences.push(amount.confidence);
  if (category) confidences.push(0.85);
  if (vendor) confidences.push(0.80);
  if (date) confidences.push(date.confidence);

  const confidence = confidences.length > 0
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100
    : 0;

  return {
    type,
    amount,
    category,
    vendor,
    date,
    description,
    confidence,
    rawText,
    extractedFields,
  };
}

// Re-export the regex function for direct use (fast path, tests, etc.)
export { extractTransaction as extractTransactionRegex } from './nlu-extractor.js';
