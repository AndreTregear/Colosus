/**
 * Benchmark: Local (35B) vs HPC (122B) — latency & accuracy comparison.
 *
 * Runs identical prompts through both backends and compares:
 *   - Latency (ms per response)
 *   - Response quality (pattern matching, tool usage, factual accuracy)
 *   - Full funnel: browse → order → payment
 *
 * Also tests HPC ASR and TTS endpoints.
 *
 * Requires: Local vLLM (:8000), HPC LLM (:18080), HPC ASR (:18082), HPC TTS (:18083), PostgreSQL
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query, queryOne } from '../src/db/pool.js';
import * as tenantsRepo from '../src/db/tenants-repo.js';
import { setTenantId } from '../src/ai/agents.js';
import { getModel, backends, ensureHealthy, getRouterStats } from '../src/ai/model-router.js';
import { processWithHermes } from '../src/ai/mastra-bridge.js';
import { Agent } from '@mastra/core/agent';
import { allBusinessToolsWithYape } from '../src/ai/agents.js';

// ── Config ──

let localAvailable = false;
let hpcAvailable = false;
let testTenantId = '';

const PRODUCTS = [
  { name: 'Pollo a la Brasa', price: 22.90, category: 'platos' },
  { name: 'Lomo Saltado',     price: 25.00, category: 'platos' },
  { name: 'Chicha Morada 1L', price: 6.00,  category: 'bebidas' },
  { name: 'Inca Kola 500ml',  price: 3.50,  category: 'bebidas' },
];

// ── Helpers ──

function strip(t: string) { return t.replace(/<think>[\s\S]*?<\/think>/g, '').trim(); }

interface BenchResult {
  backend: string;
  prompt: string;
  reply: string;
  latencyMs: number;
  passed: boolean;
  details: string;
}

const results: BenchResult[] = [];

/** Run a prompt through a specific backend and measure. */
async function benchPrompt(
  backendName: 'local' | 'hpc',
  prompt: string,
  check: (reply: string) => { passed: boolean; details: string },
): Promise<BenchResult> {
  const model = getModel(backendName);
  const agent = new Agent({
    id: `bench-${backendName}`,
    name: `Bench ${backendName}`,
    instructions: `Vendedor de pollería. Español conciso. NUNCA inventes precios. Usa product-catalog para precios. /no_think`,
    model,
    tools: allBusinessToolsWithYape,
  });

  setTenantId(testTenantId);
  const start = Date.now();
  const result = await agent.generate(prompt, { maxSteps: 6 });
  const latencyMs = Date.now() - start;
  const reply = strip(result.text || '');
  const { passed, details } = check(reply);

  const r: BenchResult = { backend: backendName, prompt: prompt.slice(0, 60), reply: reply.slice(0, 200), latencyMs, passed, details };
  results.push(r);
  return r;
}

// ── Setup ──

beforeAll(async () => {
  localAvailable = await ensureHealthy('local');
  hpcAvailable = await ensureHealthy('hpc');

  if (!localAvailable && !hpcAvailable) {
    console.warn('[bench] No backends available — tests will be skipped');
    return;
  }

  console.log(`[bench] Local: ${localAvailable ? 'UP' : 'DOWN'}, HPC: ${hpcAvailable ? 'UP' : 'DOWN'}`);

  // Create test tenant + seed products
  const tenant = await tenantsRepo.createTenant({
    name: 'Pollería Benchmark',
    slug: `bench-${Date.now().toString(36)}`,
  });
  testTenantId = tenant.id;

  for (const p of PRODUCTS) {
    await query(
      `INSERT INTO products (tenant_id, name, price, category, product_type, active) VALUES ($1, $2, $3, $4, 'physical', true)`,
      [testTenantId, p.name, p.price, p.category],
    );
  }

  setTenantId(testTenantId);
  console.log(`[bench] Tenant ${testTenantId} seeded with ${PRODUCTS.length} products`);
});

afterAll(async () => {
  if (testTenantId) {
    await query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = $1)', [testTenantId]).catch(() => {});
    await query('DELETE FROM orders WHERE tenant_id = $1', [testTenantId]).catch(() => {});
    await query('DELETE FROM customers WHERE tenant_id = $1', [testTenantId]).catch(() => {});
    await query('DELETE FROM products WHERE tenant_id = $1', [testTenantId]).catch(() => {});
    await tenantsRepo.deleteTenant(testTenantId).catch(() => {});
  }

  // Print comparison table
  if (results.length > 0) {
    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    BENCHMARK: LOCAL (35B) vs HPC (122B)                          ║');
    console.log('╠══════════╦════════════════════════════════════╦═════════╦════════╦════════════════╣');
    console.log('║ Backend  ║ Prompt                             ║  Ms     ║ Pass?  ║ Details        ║');
    console.log('╠══════════╬════════════════════════════════════╬═════════╬════════╬════════════════╣');

    for (const r of results) {
      const be = r.backend.padEnd(8);
      const pr = r.prompt.slice(0, 34).padEnd(34);
      const ms = String(r.latencyMs).padStart(5) + 'ms';
      const pass = r.passed ? '  ✅  ' : '  ❌  ';
      const det = r.details.slice(0, 14).padEnd(14);
      console.log(`║ ${be} ║ ${pr} ║ ${ms} ║${pass}║ ${det} ║`);
    }

    console.log('╚══════════╩════════════════════════════════════╩═════════╩════════╩════════════════╝');

    // Summary stats
    const localResults = results.filter(r => r.backend === 'local');
    const hpcResults = results.filter(r => r.backend === 'hpc');
    const avg = (arr: BenchResult[]) => arr.length ? Math.round(arr.reduce((s, r) => s + r.latencyMs, 0) / arr.length) : 0;
    const passRate = (arr: BenchResult[]) => arr.length ? Math.round(arr.filter(r => r.passed).length / arr.length * 100) : 0;

    console.log(`\n  LOCAL (${backends.local.model}): avg ${avg(localResults)}ms, ${passRate(localResults)}% pass`);
    console.log(`  HPC   (${backends.hpc.model}):  avg ${avg(hpcResults)}ms, ${passRate(hpcResults)}% pass`);
    console.log(`  Speedup: ${avg(hpcResults) ? (avg(hpcResults) / Math.max(avg(localResults), 1)).toFixed(1) : '?'}x slower on HPC\n`);
  }
});

// ── Benchmarks ──

describe('Benchmark: Local vs HPC', () => {

  describe('Simple greeting', () => {
    it('LOCAL: Hola buenas tardes', async () => {
      if (!localAvailable) return;
      const r = await benchPrompt('local', 'Hola buenas tardes!', (reply) => ({
        passed: reply.length > 5 && /hola|buen|bienvenid/i.test(reply),
        details: reply.length > 5 ? 'greeted' : 'too short',
      }));
      console.log(`   LOCAL ${r.latencyMs}ms: ${r.reply.slice(0, 80)}`);
    }, 30_000);

    it('HPC: Hola buenas tardes', async () => {
      if (!hpcAvailable) return;
      const r = await benchPrompt('hpc', 'Hola buenas tardes!', (reply) => ({
        passed: reply.length > 5 && /hola|buen|bienvenid/i.test(reply),
        details: reply.length > 5 ? 'greeted' : 'too short',
      }));
      console.log(`   HPC   ${r.latencyMs}ms: ${r.reply.slice(0, 80)}`);
    }, 60_000);
  });

  describe('Product catalog query', () => {
    it('LOCAL: Qué tienen para comer?', async () => {
      if (!localAvailable) return;
      const r = await benchPrompt('local', 'Qué tienen para comer? Muéstrame todo', (reply) => {
        const hasPollo = /pollo|22\.90/i.test(reply);
        const hasLomo = /lomo|25/i.test(reply);
        const hasPrices = /S\//i.test(reply);
        return {
          passed: hasPollo && hasPrices,
          details: `pollo:${hasPollo} lomo:${hasLomo}`,
        };
      });
      console.log(`   LOCAL ${r.latencyMs}ms: ${r.reply.slice(0, 100)}`);
    }, 30_000);

    it('HPC: Qué tienen para comer?', async () => {
      if (!hpcAvailable) return;
      const r = await benchPrompt('hpc', 'Qué tienen para comer? Muéstrame todo', (reply) => {
        const hasPollo = /pollo|22\.90/i.test(reply);
        const hasLomo = /lomo|25/i.test(reply);
        const hasPrices = /S\//i.test(reply);
        return {
          passed: hasPollo && hasPrices,
          details: `pollo:${hasPollo} lomo:${hasLomo}`,
        };
      });
      console.log(`   HPC   ${r.latencyMs}ms: ${r.reply.slice(0, 100)}`);
    }, 60_000);
  });

  describe('Order creation (agentic + math)', () => {
    it('LOCAL: 2 pollos + 1 chicha = S/51.80', async () => {
      if (!localAvailable) return;
      const r = await benchPrompt('local',
        '[Cliente WhatsApp: 51900000001@s.whatsapp.net]\nDame 2 pollos a la brasa y 1 chicha morada. Ese es mi pedido.',
        (reply) => {
          const hasTotal = /51\.80|51,80/i.test(reply);
          const hasOrder = /pedido|#\d|creado/i.test(reply);
          return { passed: hasTotal || hasOrder, details: `total:${hasTotal} order:${hasOrder}` };
        },
      );
      console.log(`   LOCAL ${r.latencyMs}ms: ${r.reply.slice(0, 120)}`);
    }, 60_000);

    it('HPC: 2 pollos + 1 chicha = S/51.80', async () => {
      if (!hpcAvailable) return;
      const r = await benchPrompt('hpc',
        '[Cliente WhatsApp: 51900000002@s.whatsapp.net]\nDame 2 pollos a la brasa y 1 chicha morada. Ese es mi pedido.',
        (reply) => {
          const hasTotal = /51\.80|51,80/i.test(reply);
          const hasOrder = /pedido|#\d|creado/i.test(reply);
          return { passed: hasTotal || hasOrder, details: `total:${hasTotal} order:${hasOrder}` };
        },
      );
      console.log(`   HPC   ${r.latencyMs}ms: ${r.reply.slice(0, 120)}`);
    }, 60_000);
  });

  describe('Complex multi-item math', () => {
    it('LOCAL: 3 lomos + 2 inca kolas = S/82.00', async () => {
      if (!localAvailable) return;
      const r = await benchPrompt('local',
        '[Cliente WhatsApp: 51900000003@s.whatsapp.net]\nNecesito 3 lomos saltados y 2 inca kolas. Confirmo pedido.',
        (reply) => {
          const hasTotal = /82\.00|82,00|82\b/i.test(reply);
          const hasOrder = /pedido|#\d|creado/i.test(reply);
          return { passed: hasTotal || hasOrder, details: `total:${hasTotal} order:${hasOrder}` };
        },
      );
      console.log(`   LOCAL ${r.latencyMs}ms: ${r.reply.slice(0, 120)}`);
    }, 60_000);

    it('HPC: 3 lomos + 2 inca kolas = S/82.00', async () => {
      if (!hpcAvailable) return;
      const r = await benchPrompt('hpc',
        '[Cliente WhatsApp: 51900000004@s.whatsapp.net]\nNecesito 3 lomos saltados y 2 inca kolas. Confirmo pedido.',
        (reply) => {
          const hasTotal = /82\.00|82,00|82\b/i.test(reply);
          const hasOrder = /pedido|#\d|creado/i.test(reply);
          return { passed: hasTotal || hasOrder, details: `total:${hasTotal} order:${hasOrder}` };
        },
      );
      console.log(`   HPC   ${r.latencyMs}ms: ${r.reply.slice(0, 120)}`);
    }, 60_000);
  });

  describe('Colloquial slang understanding', () => {
    it('LOCAL: "Causa qué hay de jama?"', async () => {
      if (!localAvailable) return;
      const r = await benchPrompt('local', 'Causa qué hay de jama? Algo rico pa hoy día?', (reply) => ({
        passed: /pollo|menú|plato|comid|S\//i.test(reply),
        details: /S\//.test(reply) ? 'prices shown' : 'no prices',
      }));
      console.log(`   LOCAL ${r.latencyMs}ms: ${r.reply.slice(0, 100)}`);
    }, 30_000);

    it('HPC: "Causa qué hay de jama?"', async () => {
      if (!hpcAvailable) return;
      const r = await benchPrompt('hpc', 'Causa qué hay de jama? Algo rico pa hoy día?', (reply) => ({
        passed: /pollo|menú|plato|comid|S\//i.test(reply),
        details: /S\//.test(reply) ? 'prices shown' : 'no prices',
      }));
      console.log(`   HPC   ${r.latencyMs}ms: ${r.reply.slice(0, 100)}`);
    }, 60_000);
  });

  describe('Price negotiation resistance', () => {
    it('LOCAL: "Déjame el pollo en 15 soles"', async () => {
      if (!localAvailable) return;
      const r = await benchPrompt('local', 'El pollo está muy caro, déjamelo en 15 soles pe', (reply) => {
        const firmPrice = /22\.90|22,90/i.test(reply);
        const noDiscount = !/15\s*soles|S\/\s*15\.00/i.test(reply);
        return { passed: firmPrice, details: `firm:${firmPrice} no15:${noDiscount}` };
      });
      console.log(`   LOCAL ${r.latencyMs}ms: ${r.reply.slice(0, 100)}`);
    }, 30_000);

    it('HPC: "Déjame el pollo en 15 soles"', async () => {
      if (!hpcAvailable) return;
      const r = await benchPrompt('hpc', 'El pollo está muy caro, déjamelo en 15 soles pe', (reply) => {
        const firmPrice = /22\.90|22,90/i.test(reply);
        const noDiscount = !/15\s*soles|S\/\s*15\.00/i.test(reply);
        return { passed: firmPrice, details: `firm:${firmPrice} no15:${noDiscount}` };
      });
      console.log(`   HPC   ${r.latencyMs}ms: ${r.reply.slice(0, 100)}`);
    }, 60_000);
  });

  // ── HPC ASR / TTS ──

  describe('HPC ASR + TTS endpoints', () => {
    it('HPC ASR health check', async () => {
      const res = await fetch('http://localhost:18082/health', { signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (!res?.ok) { console.log('   ⚠️  HPC ASR not available'); return; }
      const body = await res.json() as any;
      console.log(`   ✅ HPC ASR: ${body.model} — ${body.status}`);
      expect(body.status).toBe('healthy');
    }, 5_000);

    it('HPC TTS health check', async () => {
      const res = await fetch('http://localhost:18083/health', { signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (!res?.ok) { console.log('   ⚠️  HPC TTS not available'); return; }
      const body = await res.json() as any;
      console.log(`   ✅ HPC TTS: ${body.model} — ${body.status}`);
      console.log(`   🎙️  Voices: ${body.speakers?.join(', ')}`);
      expect(body.status).toBe('healthy');
      expect(body.speakers.length).toBeGreaterThan(0);
    }, 5_000);
  });

  // ── Router stats ──

  describe('Router', () => {
    it('should report stats', () => {
      const stats = getRouterStats();
      console.log('\n   Router stats:', JSON.stringify(stats, null, 2));
      expect(stats.local).toBeDefined();
      expect(stats.hpc).toBeDefined();
    });
  });
});
