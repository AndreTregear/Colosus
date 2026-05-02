#!/usr/bin/env tsx
/**
 * Generate synthetic RL training data for Hermes-RL.
 * 
 * Creates 100+ multi-turn conversation trajectories with reward signals.
 * PII is scrubbed before writing. Output: JSONL for the RL trainer.
 * 
 * Usage: npx tsx scripts/generate-rl-training.ts [--output /tmp/rl-rollouts/synthetic-training.jsonl]
 */

import fs from 'node:fs';
import path from 'node:path';
import { scrubPII } from '../src/ai/pii-scrubber.js';

const OUTPUT = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : '/tmp/rl-rollouts/synthetic-training.jsonl';

// ── Business templates ──

interface BusinessTemplate {
  type: string;
  name: string;
  products: Array<{ name: string; price: number }>;
  services?: Array<{ name: string; price: number }>;
}

const BUSINESSES: BusinessTemplate[] = [
  {
    type: 'polleria',
    name: 'Pollería El Sabrosito',
    products: [
      { name: 'Pollo a la Brasa', price: 22.90 },
      { name: 'Chifa de Pollo', price: 18.50 },
      { name: 'Pollo Entero', price: 64.90 },
      { name: 'Papas Fritas', price: 10.00 },
      { name: 'Chicha Morada 1L', price: 6.00 },
      { name: 'Gaseosa 1L', price: 5.00 },
    ],
  },
  {
    type: 'bodega',
    name: 'Bodega Don Carlos',
    products: [
      { name: 'Arroz Costeño 5kg', price: 18.50 },
      { name: 'Aceite Primor 1L', price: 8.90 },
      { name: 'Leche Gloria 400g', price: 4.20 },
      { name: 'Azúcar Rubia 1kg', price: 4.50 },
      { name: 'Fideos Don Vittorio 500g', price: 3.80 },
    ],
  },
  {
    type: 'ferreteria',
    name: 'Ferretería El Constructor',
    products: [
      { name: 'Bolsa de Cemento', price: 32.00 },
      { name: 'Varilla de Fierro', price: 35.00 },
      { name: 'Plancha de Triplay', price: 89.00 },
      { name: 'Clavo 3 pulgadas (kg)', price: 8.00 },
      { name: 'Tubo PVC 4 pulgadas', price: 22.00 },
    ],
  },
  {
    type: 'salon',
    name: 'Salón Bella María',
    services: [
      { name: 'Corte de Cabello', price: 25.00 },
      { name: 'Tinte Completo', price: 80.00 },
      { name: 'Manicure', price: 30.00 },
      { name: 'Pedicure', price: 35.00 },
      { name: 'Alisado Keratina', price: 150.00 },
    ],
    products: [],
  },
  {
    type: 'tienda',
    name: 'Tienda de Ropa Lucía',
    products: [
      { name: 'Blusa', price: 42.50 },
      { name: 'Pantalón', price: 77.50 },
      { name: 'Vestido', price: 95.00 },
      { name: 'Polo', price: 35.00 },
      { name: 'Falda', price: 55.00 },
    ],
  },
];

// ── Peruvian names ──
const NAMES = [
  'María García', 'Carlos Quispe', 'Rosa Huamán', 'Valentina López',
  'Diego Mendoza', 'Pedro Chávez', 'Carmen Torres', 'Jorge Vargas',
  'Lucía Fernández', 'Roberto Silva', 'Ana Castillo', 'Luis Ramos',
  'Elena Flores', 'Marco Díaz', 'Patricia Rojas', 'Fernando Cruz',
  'Isabel Morales', 'Ricardo Paredes', 'Sofía Gutiérrez', 'Andrés Salazar',
];

const PHONES = [
  '+51 987 654 321', '+51 912 345 678', '+51 945 678 901', '+51 923 456 789',
  '+51 956 789 012', '+51 934 567 890', '+51 967 890 123', '+51 978 901 234',
];

// ── Scenario generators ──

type Turn = { role: 'user' | 'assistant'; content: string; reward?: number; rewardSource?: string };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomQty(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOrderConversation(biz: BusinessTemplate): Turn[] {
  const product = pick(biz.products || biz.services!);
  const qty = randomQty(1, 10);
  const total = (product.price * qty).toFixed(2);
  const name = pick(NAMES);
  const phone = pick(PHONES);

  return [
    { role: 'user', content: `Hola, quiero pedir ${qty} ${product.name} por favor` },
    { role: 'assistant', content: `¡Hola! Claro, ${qty} ${product.name} serían S/${total}. ¿A nombre de quién?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: `A nombre de ${name}, mi número es ${phone}` },
    { role: 'assistant', content: `Perfecto. Pedido registrado: ${qty}x ${product.name} = S/${total} para ${name}. ¿Pago por Yape, efectivo o tarjeta?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Yape, ya te mando el comprobante' },
    { role: 'assistant', content: `Listo, esperamos tu Yape de S/${total}. Cuando lo envíes, mándame el pantallazo para confirmarlo. ¡Gracias!`, reward: 1, rewardSource: 'explicit' },
  ];
}

function generatePriceInquiry(biz: BusinessTemplate): Turn[] {
  const items = biz.products.length > 0 ? biz.products : biz.services!;
  const p1 = items[0];
  const p2 = items.length > 1 ? items[1] : items[0];

  return [
    { role: 'user', content: `Cuánto cuesta el ${p1.name} y el ${p2.name}?` },
    { role: 'assistant', content: `${p1.name}: S/${p1.price.toFixed(2)}\n${p2.name}: S/${p2.price.toFixed(2)}\n\n¿Te gustaría hacer un pedido?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Gracias, lo voy a pensar' },
    { role: 'assistant', content: '¡Dale! Aquí estamos cuando te decidas. 👍', reward: 0, rewardSource: 'silence' },
  ];
}

function generateComplaint(biz: BusinessTemplate): Turn[] {
  const items = biz.products.length > 0 ? biz.products : biz.services!;
  const product = pick(items);
  return [
    { role: 'user', content: `Oye, el ${product.name} que pedí ayer llegó en mal estado. Quiero mi dinero de vuelta.` },
    { role: 'assistant', content: `Lamento mucho lo sucedido con tu ${product.name}. Voy a registrar tu reclamo y coordinar la devolución de S/${product.price.toFixed(2)}. ¿Me puedes enviar una foto del producto?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Ya te la mandé por WhatsApp' },
    { role: 'assistant', content: `Recibido. Ya procesé tu devolución de S/${product.price.toFixed(2)}. Se te abonará en 24 horas. Disculpa las molestias. 🙏`, reward: 1, rewardSource: 'explicit' },
  ];
}

function generateBadResponse(biz: BusinessTemplate): Turn[] {
  const items = biz.products.length > 0 ? biz.products : biz.services!;
  const product = pick(items);
  return [
    { role: 'user', content: `Necesito 5 ${product.name}` },
    { role: 'assistant', content: 'I can help you with that! Let me check the inventory for you.', reward: -1, rewardSource: 'correction' },
    { role: 'user', content: 'Habla en español por favor, no entiendo inglés' },
    { role: 'assistant', content: `¡Disculpa! 5 ${product.name} serían S/${(product.price * 5).toFixed(2)}. ¿Confirmo el pedido?`, reward: 1, rewardSource: 'correction' },
  ];
}

function generateRequery(biz: BusinessTemplate): Turn[] {
  return [
    { role: 'user', content: '¿Cuál es el horario de atención?' },
    { role: 'assistant', content: 'Puedes consultar nuestros productos en el menú.', reward: -1, rewardSource: 'requery' },
    { role: 'user', content: 'Te pregunté por el HORARIO, no por los productos' },
    { role: 'assistant', content: 'Nuestro horario de atención es de Lunes a Sábado de 8am a 8pm, y Domingos de 9am a 3pm.', reward: 1, rewardSource: 'explicit' },
  ];
}

function generateAppointment(biz: BusinessTemplate): Turn[] {
  if (!biz.services) return generatePriceInquiry(biz);
  const service = pick(biz.services);
  const name = pick(NAMES);
  return [
    { role: 'user', content: `Hola, quiero agendar una cita para ${service.name} el viernes a las 3pm` },
    { role: 'assistant', content: `¡Perfecto! Tenemos disponibilidad el viernes a las 3pm para ${service.name} (S/${service.price.toFixed(2)}). ¿A nombre de quién agendo?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: `${name}` },
    { role: 'assistant', content: `Cita agendada: ${service.name} para ${name}, viernes 3:00pm. Costo: S/${service.price.toFixed(2)}. Te enviaré un recordatorio. ✅`, reward: 1, rewardSource: 'explicit' },
  ];
}

function generateBulkOrder(biz: BusinessTemplate): Turn[] {
  const items = biz.products.length > 0 ? biz.products : biz.services!;
  const product = pick(items);
  const qty = randomQty(20, 100);
  const total = (product.price * qty).toFixed(2);
  return [
    { role: 'user', content: `Necesito ${qty} ${product.name} para una obra. Necesito factura con RUC 20601234567` },
    { role: 'assistant', content: `Pedido grande: ${qty}x ${product.name} = S/${total} + IGV 18% = S/${(parseFloat(total) * 1.18).toFixed(2)}.\n\nFactura a RUC 20601234567. ¿Confirmo?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Sí, confirma. Pago contra entrega.' },
    { role: 'assistant', content: `Pedido confirmado: ${qty}x ${product.name} = S/${(parseFloat(total) * 1.18).toFixed(2)} (IGV incluido).\nFactura: RUC 20601234567\nPago: Contra entrega\n\nTe confirmo la fecha de entrega en breve. 📦`, reward: 1, rewardSource: 'explicit' },
  ];
}

function generateYapePayment(biz: BusinessTemplate): Turn[] {
  const items = biz.products.length > 0 ? biz.products : biz.services!;
  const product = pick(items);
  const name = pick(NAMES);
  return [
    { role: 'user', content: `Ya hice el Yape de S/${product.price.toFixed(2)} por el ${product.name}` },
    { role: 'assistant', content: `Recibido. Veo un Yape de ${name} por S/${product.price.toFixed(2)}. ¿Es correcto?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Sí, ese es' },
    { role: 'assistant', content: `✅ Pago confirmado: S/${product.price.toFixed(2)} por ${product.name}. ¡Gracias ${name}!`, reward: 1, rewardSource: 'explicit' },
  ];
}

function generateStockCheck(biz: BusinessTemplate): Turn[] {
  const items = biz.products.length > 0 ? biz.products : biz.services!;
  const product = pick(items);
  return [
    { role: 'user', content: `¿Cuánto ${product.name} me queda en stock?` },
    { role: 'assistant', content: `Tienes 15 unidades de ${product.name} en stock. A tu ritmo de ventas, te duran unos 5 días. ¿Quieres que programe un reabastecimiento?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Sí, pide 50 más' },
    { role: 'assistant', content: `Listo, registré pedido de reabastecimiento: 50x ${product.name}. Te aviso cuando llegue el proveedor. 📋`, reward: 1, rewardSource: 'explicit' },
  ];
}

function generateDailySummary(_biz: BusinessTemplate): Turn[] {
  const sales = randomQty(800, 3500);
  const orders = randomQty(15, 45);
  return [
    { role: 'user', content: '¿Cómo me fue hoy en ventas?' },
    { role: 'assistant', content: `📊 Resumen del día:\n• Ventas: S/${sales.toFixed(2)}\n• Pedidos: ${orders}\n• Ticket promedio: S/${(sales / orders).toFixed(2)}\n• Producto estrella: Pollo a la Brasa (${randomQty(10, 25)} unidades)\n\n¿Quieres más detalle?`, reward: 1, rewardSource: 'explicit' },
    { role: 'user', content: 'Perfecto, gracias Yaya' },
    { role: 'assistant', content: '¡De nada! Mañana te mando el resumen automático. 💪', reward: 1, rewardSource: 'explicit' },
  ];
}

// ── Generator ──

const SCENARIOS = [
  generateOrderConversation,
  generatePriceInquiry,
  generateComplaint,
  generateBadResponse,
  generateRequery,
  generateAppointment,
  generateBulkOrder,
  generateYapePayment,
  generateStockCheck,
  generateDailySummary,
];

function generateTrajectory(index: number) {
  const biz = BUSINESSES[index % BUSINESSES.length];
  const scenario = SCENARIOS[index % SCENARIOS.length];
  const turns = scenario(biz);

  // Scrub PII from all turns
  const scrubbedTurns = turns.map(t => ({
    ...t,
    content: scrubPII(t.content),
  }));

  return {
    sessionId: `synthetic_${biz.type}_${index}_${Date.now()}`,
    turns: scrubbedTurns,
    completedAt: Date.now(),
  };
}

// ── Main ──

const COUNT = 120;
console.log(`Generating ${COUNT} synthetic RL training trajectories...`);

const dir = path.dirname(OUTPUT);
fs.mkdirSync(dir, { recursive: true });

const lines: string[] = [];
for (let i = 0; i < COUNT; i++) {
  lines.push(JSON.stringify(generateTrajectory(i)));
}

fs.writeFileSync(OUTPUT, lines.join('\n') + '\n');

// Stats
const totalTurns = lines.reduce((acc, l) => {
  const t = JSON.parse(l);
  return acc + t.turns.length;
}, 0);
const positiveTurns = lines.reduce((acc, l) => {
  const t = JSON.parse(l);
  return acc + t.turns.filter((turn: any) => turn.reward === 1).length;
}, 0);
const negativeTurns = lines.reduce((acc, l) => {
  const t = JSON.parse(l);
  return acc + t.turns.filter((turn: any) => turn.reward === -1).length;
}, 0);

console.log(`\n✅ Generated ${COUNT} trajectories → ${OUTPUT}`);
console.log(`   Total turns: ${totalTurns}`);
console.log(`   Positive (+1): ${positiveTurns}`);
console.log(`   Negative (-1): ${negativeTurns}`);
console.log(`   Neutral (0): ${totalTurns - positiveTurns - negativeTurns}`);
console.log(`   File size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
