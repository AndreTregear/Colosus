/**
 * Live persona tests — 10 Peruvian personas talk to Yaya via the vLLM API.
 * Tests AI response quality: Spanish, relevant, references real products.
 * Also generates RL training trajectories as a side effect.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';

const VLLM_URL = process.env.AI_BASE_URL || 'http://localhost:8000/v1';
const VLLM_KEY = process.env.AI_API_KEY || 'megustalaia';
const MODEL = process.env.AI_MODEL || 'qwen3.5-27b';

const SYSTEM_PROMPT = `Eres Yaya, un asistente de negocios para micro-empresas peruanas. Vives en WhatsApp.
Habla español peruano natural. Sé directo, cálido y conciso. Usa Soles (S/).
Registra ventas, controla inventario, gestiona clientes, valida pagos Yape/Plin, agenda citas.
NUNCA inventes datos — si no tienes info real, dilo. Confirma acciones con montos exactos.`;

interface Persona {
  name: string;
  business: string;
  businessContext: string;
  messages: Array<{ role: 'user'; content: string }>;
  expectations: {
    mustContain?: RegExp[];
    mustBeSpanish?: boolean;
    minLength?: number;
  };
}

const PERSONAS: Persona[] = [
  {
    name: 'María (ama de casa, Lima)',
    business: 'Pollería El Sabrosito',
    businessContext: 'Productos: Pollo a la Brasa S/22.90, Chifa de Pollo S/18.50, Chicha Morada 1L S/6.00, Pollo Entero S/64.90, Papas Fritas S/10.00, Gaseosa 1L S/5.00',
    messages: [{ role: 'user', content: 'Hola! Quiero pedir 2 pollos a la brasa y una chicha morada por favor' }],
    expectations: { mustContain: [/S\/|soles/i, /pollo|brasa/i], mustBeSpanish: true, minLength: 30 },
  },
  {
    name: 'Carlos (albañil, Arequipa)',
    business: 'Ferretería El Constructor',
    businessContext: 'Productos: Bolsa de Cemento S/32.00, Varilla de Fierro S/35.00, Plancha de Triplay S/89.00',
    messages: [{ role: 'user', content: 'Compadre, necesito saber el precio del cemento y fierro. Cuánto me sale 10 bolsas de cemento?' }],
    expectations: { mustContain: [/S\/|32|320/i, /cemento/i], mustBeSpanish: true, minLength: 20 },
  },
  {
    name: 'Doña Rosa (bodeguera, Callao)',
    business: 'Bodega Don Carlos',
    businessContext: 'Productos: Arroz Costeño 5kg S/18.50, Aceite Primor 1L S/8.90, Leche Gloria 400g S/4.20',
    messages: [{ role: 'user', content: 'Necesito reabastecer mi bodega. Cuánto arroz me queda? Y dame precios del aceite y la leche' }],
    expectations: { mustContain: [/arroz|aceite|leche/i, /S\/|precio/i], mustBeSpanish: true, minLength: 30 },
  },
  {
    name: 'Valentina (joven, San Isidro)',
    business: 'Salón Bella María',
    businessContext: 'Salón de belleza. Servicios: Corte S/25, Tinte S/80, Manicure S/30, Pedicure S/35, Alisado S/150',
    messages: [{ role: 'user', content: 'Holaa! Quiero agendar una cita para corte y tinte el sábado por la mañana 💇‍♀️' }],
    expectations: { mustContain: [/cita|agendar|sábado|horario/i], mustBeSpanish: true, minLength: 20 },
  },
  {
    name: 'Diego (estudiante, Miraflores)',
    business: 'Tienda de Ropa Lucía',
    businessContext: 'Productos: Blusa S/42.50, Pantalón S/77.50',
    messages: [{ role: 'user', content: 'Hola, cuánto cuestan los pantalones? Hay algún descuento para estudiantes?' }],
    expectations: { mustContain: [/S\/|77|pantalón|precio/i], mustBeSpanish: true, minLength: 20 },
  },
  {
    name: 'Pedro (dueño de restaurante, La Molina)',
    business: 'Pollería El Sabrosito',
    businessContext: 'Productos: Pollo a la Brasa S/22.90, Chifa de Pollo S/18.50, Pollo Entero S/64.90, Papas Fritas S/10.00, Chicha Morada 1L S/6.00, Gaseosa 1L S/5.00',
    messages: [{ role: 'user', content: 'Necesito hacer un pedido grande para un evento. 50 pollos enteros con papas y chicha. Dame el total y si hay precio por mayor' }],
    expectations: { mustContain: [/S\/|total|pollo/i], mustBeSpanish: true, minLength: 40 },
  },
  {
    name: 'Señora Carmen (adulta mayor, Breña)',
    business: 'Bodega Don Carlos',
    businessContext: 'Productos: Arroz Costeño 5kg S/18.50, Aceite Primor 1L S/8.90, Leche Gloria 400g S/4.20',
    messages: [{ role: 'user', content: 'Hijito me puedes ayudar? Quiero comprar arroz y leche pero no sé cuánto cuesta ahora. Antes era más barato' }],
    expectations: { mustContain: [/arroz|leche|S\//i], mustBeSpanish: true, minLength: 20 },
  },
  {
    name: 'Jorge (contratista, Surco)',
    business: 'Ferretería El Constructor',
    businessContext: 'Productos: Bolsa de Cemento S/32.00, Varilla de Fierro S/35.00, Plancha de Triplay S/89.00',
    messages: [{ role: 'user', content: 'Necesito 100 bolsas de cemento, 50 varillas de fierro y 20 planchas de triplay. Necesito factura con RUC 20601234567. Dame el total con IGV' }],
    expectations: { mustContain: [/S\/|total|factura|RUC|IGV/i], mustBeSpanish: true, minLength: 50 },
  },
  {
    name: 'Lucía (influencer, Barranco)',
    business: 'Tienda de Ropa Lucía',
    businessContext: 'Productos: Blusa S/42.50, Pantalón S/77.50',
    messages: [{ role: 'user', content: 'Hola amiga! Qué tienen de nuevo? Estoy buscando algo lindo para un evento. Tienen blusas en colores pasteles?' }],
    expectations: { mustContain: [/blusa|ropa|S\//i], mustBeSpanish: true, minLength: 20 },
  },
  {
    name: 'Roberto (delivery, SJL)',
    business: 'Pollería El Sabrosito',
    businessContext: 'Productos: Pollo a la Brasa S/22.90, Chifa de Pollo S/18.50, Pollo Entero S/64.90, Papas Fritas S/10.00',
    messages: [{ role: 'user', content: 'Soy el delivery. El pedido #1234 de la señora García, cuál es la dirección de entrega? Y qué lleva el pedido?' }],
    expectations: { mustContain: [/pedido|dirección|entrega|orden/i], mustBeSpanish: true, minLength: 20 },
  },
];

// Collected trajectories for RL training
const trajectories: Array<{
  persona: string;
  business: string;
  turns: Array<{ role: string; content: string; reward?: number; rewardSource?: string }>;
}> = [];

async function chatWithYaya(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const response = await fetch(`${VLLM_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VLLM_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`vLLM API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

let vllmAvailable = false;

beforeAll(async () => {
  try {
    const r = await fetch(`${VLLM_URL}/models`, {
      headers: { 'Authorization': `Bearer ${VLLM_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    vllmAvailable = r.ok;
  } catch {
    console.warn('[persona-live] vLLM not available — tests will be skipped');
  }
});

describe('Persona Live Tests', () => {
  for (const persona of PERSONAS) {
    it(`${persona.name} → ${persona.business}`, async () => {
      if (!vllmAvailable) return;

      const systemPrompt = `${SYSTEM_PROMPT}\n\nNegocio: ${persona.business}\n${persona.businessContext}`;
      const userMsg = persona.messages[0].content;

      const reply = await chatWithYaya(systemPrompt, userMsg);

      // Collect trajectory
      trajectories.push({
        persona: persona.name,
        business: persona.business,
        turns: [
          { role: 'user', content: userMsg },
          { role: 'assistant', content: reply, reward: 1, rewardSource: 'test-positive' },
        ],
      });

      // Assertions
      expect(reply.length).toBeGreaterThan(persona.expectations.minLength || 10);

      if (persona.expectations.mustContain) {
        const matched = persona.expectations.mustContain.some(rx => rx.test(reply));
        expect(matched).toBe(true);
      }

      // Check it's not English
      const englishPatterns = /\b(the|this|that|with|from|have|will|your|please|thank you)\b/gi;
      const englishWordCount = (reply.match(englishPatterns) || []).length;
      expect(englishWordCount).toBeLessThan(3); // Allow minor English leakage

      console.log(`✅ ${persona.name}: ${reply.slice(0, 120)}...`);
    }, 60_000); // 60s timeout per persona (LLM generation)
  }

  it('writes collected trajectories to JSONL', async () => {
    if (!vllmAvailable || trajectories.length === 0) return;

    const dir = '/tmp/rl-rollouts';
    fs.mkdirSync(dir, { recursive: true });
    const outPath = `${dir}/persona-test-${new Date().toISOString().slice(0, 10)}.jsonl`;

    const lines = trajectories.map(t => JSON.stringify({
      sessionId: `persona-${t.persona.replace(/\s/g, '-')}`,
      turns: t.turns,
      completedAt: Date.now(),
    }));

    fs.writeFileSync(outPath, lines.join('\n') + '\n');
    console.log(`📝 Wrote ${lines.length} trajectories to ${outPath}`);
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
