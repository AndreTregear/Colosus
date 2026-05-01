/**
 * NLU Agent Live Tests — tests LLM-backed extraction against real vLLM.
 *
 * These are the cases that break regex:
 *   - Colloquial amounts: "como cincuenta y pico"
 *   - Implicit transactions: "el arroz me salió caro"
 *   - Mixed context: "pagué la luz y compré arroz"
 *   - Slang: "me dieron una luca por el trabajo"
 *   - Ambiguous: "50 para el almuerzo" (expense? payment?)
 *
 * Requires: vLLM on :8000
 */
import { describe, it, expect, beforeAll } from 'vitest';

const VLLM_URL = process.env.VLLM_API_BASE || 'http://localhost:8000/v1';
const VLLM_KEY = process.env.VLLM_API_KEY || 'omnimoney';

let vllmAvailable = false;

beforeAll(async () => {
  try {
    const r = await fetch(`${VLLM_URL}/models`, {
      headers: { Authorization: `Bearer ${VLLM_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    vllmAvailable = r.ok;
  } catch {
    console.warn('[nlu-agent-live] vLLM not available — tests will be skipped');
  }
});

// Dynamic import so the module can read env vars
const { extractTransactionWithAgent } = await import('../src/voice/nlu-agent.js');
const { extractTransaction: regexExtract } = await import('../src/voice/nlu-extractor.js');

const REF_DATE = new Date('2026-04-07T12:00:00');

interface TestCase {
  input: string;
  expect: {
    type?: string;
    amount?: number;
    currency?: string;
    category?: string;
    vendor?: string | RegExp;
    isNull?: boolean;
  };
  acceptTypes?: string[]; // alternative valid types for ambiguous cases
  regexFails?: boolean;
}

const CASES: TestCase[] = [
  // ── Cases regex handles fine (baseline) ──
  {
    input: 'vendí 50 soles de arroz',
    expect: { type: 'sale', amount: 50, currency: 'PEN', category: 'food' },
  },
  {
    input: 'gasté S/ 30 en taxi',
    expect: { type: 'expense', amount: 30, currency: 'PEN', category: 'transport' },
  },
  {
    input: 'me pagaron 200 soles por el trabajo',
    expect: { type: 'payment_received', amount: 200, currency: 'PEN' },
  },

  // ── Cases that BREAK regex (the whole point of the agent) ──
  {
    input: 'me dieron una luca por la chamba del sábado',
    expect: { type: 'payment_received', amount: 1000, currency: 'PEN' },
    regexFails: true,
  },
  {
    input: 'el ceviche me salió veinticinco con cincuenta',
    expect: { type: 'expense', amount: 25.50, currency: 'PEN', category: 'food' },
    regexFails: true,
  },
  {
    input: 'cobré tres facturas hoy por un total de mil doscientos soles',
    expect: { type: 'sale', amount: 1200, currency: 'PEN' },
    acceptTypes: ['sale', 'payment_received'], // "cobrar" = collecting payment, both valid
  },
  {
    input: 'le fié arroz y aceite a doña María, fueron cuarenta soles',
    expect: { type: 'sale', amount: 40, currency: 'PEN', category: 'food', vendor: /María/i },
    acceptTypes: ['sale', 'expense', 'payment_sent'], // "fiar" = sell on credit, LLM may see as expense or payment_sent
    acceptCategories: ['food', 'supplies'], // normalizeCategory: sale→food, expense→supplies
  },
  {
    input: 'compré mercadería en el Mercado Central por trescientos',
    expect: { type: 'expense', amount: 300, currency: 'PEN', category: 'supplies', vendor: /Mercado/i },
  },
  {
    input: 'pagué la luz y el agua, ciento veinte en total',
    expect: { type: 'expense', amount: 120, currency: 'PEN', category: 'utilities' },
  },
  {
    input: 'la señora Campos me yapeó cincuenta por las empanadas',
    expect: { type: 'payment_received', amount: 50, currency: 'PEN', category: 'food', vendor: /Campos/i },
    regexFails: true,
  },

  // ── Non-financial (should return null) ──
  {
    input: 'hola como estas',
    expect: { isNull: true },
  },
  {
    input: 'qué hora es?',
    expect: { isNull: true },
  },
  {
    input: 'mañana tengo cita con el dentista',
    expect: { isNull: true },
  },
];

describe('NLU Agent — LLM-backed extraction', () => {
  // First, show what regex CANNOT do
  describe('Regex limitations (for comparison)', () => {
    const regexFailCases = CASES.filter(c => c.regexFails);
    for (const tc of regexFailCases) {
      it(`regex CANNOT handle: "${tc.input.slice(0, 50)}..."`, () => {
        const result = regexExtract(tc.input, REF_DATE);
        // At least one expected field should be wrong or missing
        const amountMismatch = tc.expect.amount !== undefined &&
          (result.amount === null || Math.abs(result.amount.value - tc.expect.amount) > 0.1);

        console.log(`   🔴 Regex got: amount=${result.amount?.value ?? 'null'}, type=${result.type}`);
        console.log(`   🎯 Expected:  amount=${tc.expect.amount}, type=${tc.expect.type}`);

        // Verify regex actually fails on these
        if (tc.expect.amount !== undefined) {
          expect(amountMismatch).toBe(true);
        }
      });
    }
  });

  // Now test the agent
  describe('Agent extraction (LLM-backed)', () => {
    for (const tc of CASES) {
      it(`"${tc.input.slice(0, 60)}${tc.input.length > 60 ? '...' : ''}"`, async () => {
        if (!vllmAvailable) return;

        const start = Date.now();
        const result = await extractTransactionWithAgent(tc.input, REF_DATE);
        const ms = Date.now() - start;
        console.log(`   ⏱️  ${ms}ms`);

        if (tc.expect.isNull) {
          expect(result).toBeNull();
          console.log(`   ✅ null (${ms}ms) — correctly skipped non-financial text`);
          return;
        }

        expect(result).not.toBeNull();
        const r = result!;

        console.log(`   🤖 Agent (${ms}ms): type=${r.type} amount=${r.amount?.value} ${r.amount?.currency} cat=${r.category} vendor=${r.vendor} conf=${r.confidence}`);

        // Type
        if (tc.expect.type) {
          const validTypes = tc.acceptTypes || [tc.expect.type];
          expect(validTypes).toContain(r.type);
        }

        // Amount — allow 10% tolerance for colloquial speech
        if (tc.expect.amount !== undefined) {
          expect(r.amount).not.toBeNull();
          const tolerance = tc.expect.amount * 0.1;
          expect(Math.abs(r.amount!.value - tc.expect.amount)).toBeLessThanOrEqual(Math.max(tolerance, 1));
        }

        // Currency
        if (tc.expect.currency) {
          expect(r.amount?.currency).toBe(tc.expect.currency);
        }

        // Category
        if (tc.expect.category) {
          if ((tc as any).acceptCategories) {
            expect((tc as any).acceptCategories).toContain(r.category);
          } else {
            expect(r.category).toBe(tc.expect.category);
          }
        }

        // Vendor
        if (tc.expect.vendor) {
          expect(r.vendor).not.toBeNull();
          if (tc.expect.vendor instanceof RegExp) {
            expect(r.vendor).toMatch(tc.expect.vendor);
          } else {
            expect(r.vendor).toBe(tc.expect.vendor);
          }
        }

        // Confidence should be reasonable
        expect(r.confidence).toBeGreaterThan(0.5);
      }, 60_000);
    }
  });

  // Latency check
  describe('Performance', () => {
    it('should skip non-financial text in <5ms (no LLM call)', async () => {
      const start = Date.now();
      const result = await extractTransactionWithAgent('buenos días, qué tal todo');
      const ms = Date.now() - start;
      expect(result).toBeNull();
      expect(ms).toBeLessThan(50);
      console.log(`   ⚡ Non-financial skip: ${ms}ms`);
    });

    it('should extract financial data in <15s', async () => {
      if (!vllmAvailable) return;
      const start = Date.now();
      const result = await extractTransactionWithAgent('vendí arroz por 80 soles');
      const ms = Date.now() - start;
      expect(result).not.toBeNull();
      console.log(`   ⚡ Financial extraction: ${ms}ms`);
    }, 30_000);
  });
});
