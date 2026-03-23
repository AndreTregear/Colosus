#!/usr/bin/env tsx
/**
 * generate-rl-training.ts — Synthetic RL training data generator.
 *
 * Generates 100+ multi-turn conversation trajectories in JSONL format
 * for GRPO (Group Relative Policy Optimization) training of the Yaya
 * business assistant.
 *
 * Usage:
 *   npx tsx scripts/generate-rl-training.ts
 *   npx tsx scripts/generate-rl-training.ts --count 200
 *   npx tsx scripts/generate-rl-training.ts --output /custom/path.jsonl
 *
 * Each trajectory includes:
 * - Multi-turn user/assistant conversation
 * - Reward signals: +1 (good), 0 (neutral), -1 (error/bad)
 * - PII-scrubbed content safe for training
 */

import fs from 'node:fs';
import path from 'node:path';
import { scrubPII } from '../src/ai/pii-scrubber.js';

// ── CLI args ──

const args = process.argv.slice(2);
const countIdx = args.indexOf('--count');
const outputIdx = args.indexOf('--output');

const TRAJECTORY_COUNT = countIdx >= 0 ? parseInt(args[countIdx + 1], 10) : 120;
const OUTPUT_DIR = '/tmp/rl-rollouts';
const OUTPUT_FILE = outputIdx >= 0
  ? args[outputIdx + 1]
  : path.join(OUTPUT_DIR, 'synthetic-training.jsonl');

// ── Business data (mirrors production tenants) ──

interface BusinessProfile {
  tenantKey: string;
  businessName: string;
  businessType: string;
  products: Array<{ name: string; price: number; unit?: string }>;
  currency: string;
}

const BUSINESSES: BusinessProfile[] = [
  {
    tenantKey: 'polleria',
    businessName: 'Pollería El Sabrosito',
    businessType: 'Restaurante / Pollería',
    products: [
      { name: 'Pollo a la Brasa', price: 22.90 },
      { name: 'Chifa de Pollo', price: 18.50 },
      { name: 'Papas Fritas', price: 10.00 },
      { name: '1/4 Pollo a la Brasa', price: 12.50 },
      { name: 'Chicha Morada (jarra)', price: 8.00 },
      { name: 'Gaseosa 1.5L', price: 6.00 },
      { name: 'Ensalada', price: 7.00 },
    ],
    currency: 'PEN',
  },
  {
    tenantKey: 'bodega',
    businessName: 'Bodega Don Carlos',
    businessType: 'Bodega / Tienda de abarrotes',
    products: [
      { name: 'Arroz Costeño 5kg', price: 18.50 },
      { name: 'Aceite Primor 1L', price: 8.90 },
      { name: 'Leche Gloria 400ml', price: 4.20 },
      { name: 'Azúcar Rubia 1kg', price: 4.50 },
      { name: 'Fideos Don Vittorio 500g', price: 3.80 },
      { name: 'Atún Florida 170g', price: 5.50 },
      { name: 'Papel Higiénico (pack x4)', price: 6.90 },
    ],
    currency: 'PEN',
  },
  {
    tenantKey: 'salon',
    businessName: 'Salón Bella María',
    businessType: 'Salón de belleza',
    products: [
      { name: 'Corte de cabello', price: 25.00 },
      { name: 'Tinte completo', price: 80.00 },
      { name: 'Manicure', price: 20.00 },
      { name: 'Pedicure', price: 25.00 },
      { name: 'Planchado', price: 30.00 },
      { name: 'Tratamiento capilar', price: 45.00 },
      { name: 'Maquillaje profesional', price: 60.00 },
    ],
    currency: 'PEN',
  },
  {
    tenantKey: 'ferreteria',
    businessName: 'Ferretería El Constructor',
    businessType: 'Ferretería',
    products: [
      { name: 'Cemento Sol 42.5kg', price: 32.00, unit: 'bolsa' },
      { name: 'Fierro corrugado 1/2"', price: 35.00, unit: 'varilla' },
      { name: 'Triplay 18mm', price: 89.00, unit: 'plancha' },
      { name: 'Clavos 3"', price: 8.00, unit: 'kg' },
      { name: 'Alambre #16', price: 6.50, unit: 'kg' },
      { name: 'Pintura látex 4L', price: 45.00, unit: 'galón' },
      { name: 'Tubería PVC 4"', price: 18.00, unit: 'tubo' },
    ],
    currency: 'PEN',
  },
  {
    tenantKey: 'tienda',
    businessName: 'Tienda de Ropa Lucía',
    businessType: 'Tienda de ropa',
    products: [
      { name: 'Blusa elegante', price: 42.50 },
      { name: 'Pantalón jean', price: 77.50 },
      { name: 'Polo casual', price: 35.00 },
      { name: 'Vestido verano', price: 65.00 },
      { name: 'Falda midi', price: 55.00 },
      { name: 'Chaqueta denim', price: 89.00 },
      { name: 'Zapatillas urbanas', price: 120.00 },
    ],
    currency: 'PEN',
  },
];

// ── Peruvian name pools ──

const FIRST_NAMES_FEMALE = [
  'María', 'Rosa', 'Carmen', 'Luz', 'Ana', 'Patricia', 'Juana', 'Valentina',
  'Lucía', 'Elena', 'Sofía', 'Isabella', 'Gabriela', 'Daniela', 'Fernanda',
  'Milagros', 'Flor', 'Pilar', 'Gladys', 'Norma',
];

const FIRST_NAMES_MALE = [
  'Carlos', 'Juan', 'Pedro', 'Jorge', 'Roberto', 'Diego', 'Luis', 'Miguel',
  'Andrés', 'José', 'Fernando', 'Ricardo', 'Alberto', 'Raúl', 'Manuel',
  'César', 'Héctor', 'Óscar', 'Víctor', 'Marco',
];

const LAST_NAMES = [
  'García', 'López', 'Quispe', 'Huamán', 'Flores', 'Rojas', 'Mendoza',
  'Torres', 'Castañeda', 'Salazar', 'Díaz', 'Vargas', 'Chávez', 'Ramos',
  'Gutiérrez', 'Morales', 'Paredes', 'Vásquez', 'Cruz', 'Herrera',
];

// ── Scenario templates ──

type ScenarioType =
  | 'ordering'
  | 'pricing'
  | 'complaint'
  | 'return'
  | 'appointment'
  | 'payment'
  | 'stock_check'
  | 'bulk_order'
  | 'confused_user'
  | 'delivery';

interface ScenarioTemplate {
  type: ScenarioType;
  applicableTo: string[]; // business keys
  generateTurns: (biz: BusinessProfile, customerName: string) => Array<{
    role: 'user' | 'assistant';
    content: string;
    reward?: number;
    rewardSource?: string;
  }>;
}

// ── Helper functions ──

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPhone(): string {
  return `+51 9${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`;
}

function randomDNI(): string {
  return String(randomInt(10000000, 99999999));
}

function randomRUC(): string {
  return `20${randomInt(100000000, 999999999)}`;
}

function formatPrice(price: number): string {
  return `S/${price.toFixed(2)}`;
}

function randomCustomerName(): { name: string; gender: 'M' | 'F' } {
  const gender = Math.random() > 0.5 ? 'M' : 'F';
  const first = gender === 'M' ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
  return { name: `${first} ${pick(LAST_NAMES)}`, gender };
}

// ── Scenario implementations ──

const SCENARIOS: ScenarioTemplate[] = [
  // 1. Simple ordering
  {
    type: 'ordering',
    applicableTo: ['polleria', 'bodega', 'ferreteria', 'tienda'],
    generateTurns: (biz, name) => {
      const items = pickN(biz.products, randomInt(1, 3));
      const quantities = items.map(() => randomInt(1, 5));
      const orderText = items
        .map((item, i) => `${quantities[i]} ${item.name}`)
        .join(', ');
      const total = items.reduce((sum, item, i) => sum + item.price * quantities[i], 0);

      return [
        {
          role: 'user',
          content: `Hola buenas! Quiero pedir ${orderText} por favor.`,
        },
        {
          role: 'assistant',
          content: `¡Hola ${name.split(' ')[0]}! Con gusto te atiendo. Tu pedido sería:\n${items.map((item, i) => `• ${quantities[i]}x ${item.name} — ${formatPrice(item.price * quantities[i])}`).join('\n')}\n\nTotal: ${formatPrice(total)}\n\n¿Confirmas el pedido? ¿Para llevar o delivery?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: 'Sí, para llevar. Gracias!',
        },
        {
          role: 'assistant',
          content: `¡Perfecto! Tu pedido está confirmado por ${formatPrice(total)}. Estará listo en aproximadamente 20-30 minutos. ¡Gracias por tu preferencia! 🙏`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 2. Pricing inquiry
  {
    type: 'pricing',
    applicableTo: ['polleria', 'bodega', 'ferreteria', 'tienda'],
    generateTurns: (biz, _name) => {
      const items = pickN(biz.products, randomInt(2, 4));
      const askItems = items.map((i) => i.name).join(', ');

      return [
        {
          role: 'user',
          content: `Buenos días, ¿cuánto cuesta ${askItems}?`,
        },
        {
          role: 'assistant',
          content: `¡Buenos días! Aquí tienes los precios:\n${items.map((item) => `• ${item.name}: ${formatPrice(item.price)}${item.unit ? ` por ${item.unit}` : ''}`).join('\n')}\n\n¿Te gustaría hacer un pedido?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: 'Gracias por la info! Lo voy a pensar.',
        },
        {
          role: 'assistant',
          content: '¡De nada! Cuando gustes, aquí estamos para atenderte. ¡Que tengas buen día! 😊',
          reward: 0,
          rewardSource: 'silence',
        },
      ];
    },
  },

  // 3. Complaint
  {
    type: 'complaint',
    applicableTo: ['polleria', 'bodega', 'ferreteria', 'tienda'],
    generateTurns: (biz, name) => {
      const product = pick(biz.products);
      const complaints = [
        `llegó frío y no estaba bien cocido`,
        `estaba en mal estado, creo que está vencido`,
        `no era lo que pedí, me mandaron algo diferente`,
        `la calidad no es la misma que antes`,
        `me cobraron de más`,
      ];
      const complaint = pick(complaints);

      return [
        {
          role: 'user',
          content: `Buenas, tengo una queja. Compré ${product.name} ayer y ${complaint}. No estoy contento con el servicio.`,
        },
        {
          role: 'assistant',
          content: `Lamentamos mucho la mala experiencia, ${name.split(' ')[0]}. Nos tomamos muy en serio la calidad de nuestros productos.\n\n¿Podrías darme más detalles? ¿Tienes tu número de pedido o comprobante? Vamos a resolver esto lo antes posible.`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: `No tengo el número a la mano pero compré ayer como a las 7pm. Mi nombre es ${name}.`,
        },
        {
          role: 'assistant',
          content: `Entendido, ${name.split(' ')[0]}. Voy a revisar los pedidos de ayer por la noche para ubicar tu compra.\n\nTe ofrecemos las siguientes opciones:\n1. Reemplazo del producto sin costo\n2. Devolución del dinero\n3. Crédito para tu próxima compra\n\n¿Cuál preferirías?`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 4. Return/exchange
  {
    type: 'return',
    applicableTo: ['tienda', 'ferreteria'],
    generateTurns: (biz, _name) => {
      const product = pick(biz.products);

      return [
        {
          role: 'user',
          content: `Hola, compré un(a) ${product.name} hace 2 días pero no me queda bien. ¿Puedo hacer un cambio?`,
        },
        {
          role: 'assistant',
          content: `¡Hola! Claro, podemos ayudarte con el cambio. Para productos sin uso y con su etiqueta, aceptamos cambios hasta 7 días después de la compra.\n\n¿Tienes tu boleta o comprobante de pago? ¿Por cuál producto te gustaría cambiarlo?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: 'Sí tengo la boleta. Quiero cambiarlo por otra talla nomás.',
        },
        {
          role: 'assistant',
          content: `Perfecto, el cambio de talla es sin problema. Puedes acercarte a la tienda con el producto y tu boleta. Si quieres, también puedo verificar la disponibilidad de la talla que necesitas. ¿Qué talla buscas?`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 5. Appointment booking
  {
    type: 'appointment',
    applicableTo: ['salon'],
    generateTurns: (biz, name) => {
      const services = pickN(biz.products, randomInt(1, 2));
      const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const day = pick(days);
      const hours = ['9am', '10am', '11am', '2pm', '3pm', '4pm', '5pm'];
      const hour = pick(hours);
      const total = services.reduce((sum, s) => sum + s.price, 0);

      return [
        {
          role: 'user',
          content: `Hola! Quiero reservar una cita para ${services.map((s) => s.name.toLowerCase()).join(' y ')} el ${day} por favor.`,
        },
        {
          role: 'assistant',
          content: `¡Hola ${name.split(' ')[0]}! Con mucho gusto. Para ${services.map((s) => s.name.toLowerCase()).join(' y ')} el ${day}, ¿a qué hora te acomodaría mejor?\n\nHorarios disponibles:\n• 9:00 AM - 12:00 PM\n• 2:00 PM - 6:00 PM\n\nEl costo total sería ${formatPrice(total)}.`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: `A las ${hour} estaría perfecto!`,
        },
        {
          role: 'assistant',
          content: `¡Listo! Tu cita queda reservada:\n\n📅 ${day.charAt(0).toUpperCase() + day.slice(1)} a las ${hour}\n💇 ${services.map((s) => s.name).join(' + ')}\n💰 ${formatPrice(total)}\n\nTe esperamos, ${name.split(' ')[0]}! Si necesitas reprogramar, avísanos con anticipación. ✨`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 6. Payment inquiry (Yape/Plin)
  {
    type: 'payment',
    applicableTo: ['polleria', 'bodega', 'ferreteria', 'tienda', 'salon'],
    generateTurns: (biz, name) => {
      const product = pick(biz.products);
      const qty = randomInt(1, 3);
      const total = product.price * qty;
      const phone = randomPhone();

      return [
        {
          role: 'user',
          content: `Ya hice el pedido de ${qty} ${product.name}. ¿Aceptan Yape? ¿A qué número hago el pago?`,
        },
        {
          role: 'assistant',
          content: `¡Sí! Aceptamos Yape y Plin.\n\nDatos para el pago:\n• Yape al número: ${phone}\n• A nombre de: ${biz.businessName}\n• Monto: ${formatPrice(total)}\n\nUna vez realizado el pago, envíanos la captura para confirmarlo. 📱`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: `Listo, ya yapié ${formatPrice(total)}. De ${name}.`,
        },
        {
          role: 'assistant',
          content: `¡Perfecto, ${name.split(' ')[0]}! Recibimos tu Yape de ${formatPrice(total)}. Tu pedido está confirmado y en preparación.\n\n¡Gracias por tu compra! 🎉`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 7. Stock check
  {
    type: 'stock_check',
    applicableTo: ['bodega', 'ferreteria', 'tienda'],
    generateTurns: (biz, _name) => {
      const items = pickN(biz.products, randomInt(2, 3));

      return [
        {
          role: 'user',
          content: `Hola, ¿tienen en stock ${items.map((i) => i.name).join(' y ')}?`,
        },
        {
          role: 'assistant',
          content: `¡Hola! Déjame verificar la disponibilidad:\n${items.map((item) => `• ${item.name}: ✅ Disponible — ${formatPrice(item.price)}`).join('\n')}\n\n¿Te gustaría hacer un pedido?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: 'Ah genial, paso más tarde a recoger.',
        },
        {
          role: 'assistant',
          content: '¡Perfecto! Te esperamos. Si quieres, puedo separarte los productos para que los tengas listos cuando llegues. 😊',
          reward: 0,
          rewardSource: 'silence',
        },
      ];
    },
  },

  // 8. Bulk/wholesale order
  {
    type: 'bulk_order',
    applicableTo: ['polleria', 'bodega', 'ferreteria'],
    generateTurns: (biz, name) => {
      const product = pick(biz.products);
      const qty = randomInt(20, 100);
      const ruc = randomRUC();
      const total = product.price * qty;
      const discount = total * 0.1;

      return [
        {
          role: 'user',
          content: `Buenas, necesito ${qty} ${product.unit || 'unidades'} de ${product.name} para mi negocio. ¿Tienen precio por mayor? Necesito factura con RUC ${ruc}.`,
        },
        {
          role: 'assistant',
          content: `¡Buenos días! Para un pedido de ${qty} ${product.unit || 'unidades'} de ${product.name}, tenemos precio mayorista:\n\n• Precio unitario normal: ${formatPrice(product.price)}\n• Precio mayorista: ${formatPrice(product.price * 0.9)}\n• Total: ${formatPrice(total - discount)}\n• Ahorro: ${formatPrice(discount)}\n\n✅ Emitimos factura electrónica. Necesitaré:\n- Razón social\n- RUC\n- Dirección fiscal\n\n¿Confirmas el pedido?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: `Sí, confirmo. Razón social: Empresa ${name.split(' ')[1]} SAC. RUC: ${ruc}. Dirección: Av. Arequipa 1234, Lima.`,
        },
        {
          role: 'assistant',
          content: `¡Perfecto! Pedido confirmado:\n\n📋 Detalle:\n• ${qty}x ${product.name}\n• Total: ${formatPrice(total - discount)}\n\n🏢 Facturación:\n• ${`Empresa ${name.split(' ')[1]} SAC`}\n• RUC: ${ruc}\n\nEl pedido estará listo en 24-48 horas. Te contactaremos para coordinar la entrega. ¡Gracias por tu preferencia!`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 9. Confused/elderly user
  {
    type: 'confused_user',
    applicableTo: ['bodega', 'polleria', 'tienda'],
    generateTurns: (biz, name) => {
      const product = pick(biz.products);

      return [
        {
          role: 'user',
          content: `Hola? No sé si esto funciona... Mi hijo me dijo que puedo pedir por aquí. ¿Esto es ${biz.businessName}?`,
        },
        {
          role: 'assistant',
          content: `¡Hola! Sí, estás comunicándote con ${biz.businessName}. 😊 No te preocupes, es muy fácil.\n\nSolo dime qué necesitas y yo te ayudo con todo. ¿Qué te gustaría pedir?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: `Ah qué bueno! Necesito ${product.name} por favor. No sé cuánto cuesta.`,
        },
        {
          role: 'assistant',
          content: `¡Claro que sí! ${product.name} cuesta ${formatPrice(product.price)}.\n\n¿Cuántos te gustaría? Y dime, ¿vienes a recogerlo o te lo enviamos a tu casa?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: 'Uno nomás. Voy a recogerlo. Gracias hijito!',
        },
        {
          role: 'assistant',
          content: `¡Listo, ${name.split(' ')[0]}! Te separamos 1 ${product.name} por ${formatPrice(product.price)}.\n\nTe esperamos en la tienda. ¡Que tengas bonito día! 🤗`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 10. Delivery inquiry
  {
    type: 'delivery',
    applicableTo: ['polleria', 'bodega', 'ferreteria'],
    generateTurns: (biz, _name) => {
      const items = pickN(biz.products, 2);
      const total = items.reduce((s, i) => s + i.price, 0);
      const phone = randomPhone();

      return [
        {
          role: 'user',
          content: `Hola, ¿hacen delivery? Quiero ${items.map((i) => i.name).join(' y ')} pero estoy lejos.`,
        },
        {
          role: 'assistant',
          content: `¡Hola! Sí, hacemos delivery en la zona. El costo de envío depende de la distancia.\n\nTu pedido:\n${items.map((i) => `• ${i.name}: ${formatPrice(i.price)}`).join('\n')}\nSubtotal: ${formatPrice(total)}\n\n¿Me pasas tu dirección para calcular el costo de envío?`,
          reward: 1,
          rewardSource: 'explicit',
        },
        {
          role: 'user',
          content: 'Estoy en Av. Brasil 456, Jesús María. Mi teléfono es ' + phone,
        },
        {
          role: 'assistant',
          content: `Perfecto, Jesús María está dentro de nuestra zona de delivery.\n\n📍 Dirección: Av. Brasil 456, Jesús María\n🛵 Costo de envío: S/5.00\n💰 Total con delivery: ${formatPrice(total + 5)}\n\nTiempo estimado: 30-45 minutos.\n\n¿Confirmas tu pedido?`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 11. AI error scenario (negative reward)
  {
    type: 'ordering',
    applicableTo: ['polleria', 'bodega'],
    generateTurns: (biz, _name) => {
      const product = pick(biz.products);

      return [
        {
          role: 'user',
          content: `Quiero 3 ${product.name} para hoy.`,
        },
        {
          role: 'assistant',
          content: 'I can help you with your order. What would you like?',
          reward: -1,
          rewardSource: 'correction',
        },
        {
          role: 'user',
          content: 'No entiendo inglés, habla en español por favor.',
        },
        {
          role: 'assistant',
          content: `¡Disculpa! Tu pedido de 3 ${product.name} está confirmado. El total sería ${formatPrice(product.price * 3)}. ¿Cómo deseas pagar?`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 12. Wrong product scenario (correction)
  {
    type: 'ordering',
    applicableTo: ['polleria', 'bodega', 'ferreteria', 'tienda'],
    generateTurns: (biz, _name) => {
      const products = pickN(biz.products, 2);
      if (products.length < 2) return [];
      const wanted = products[0];
      const wrong = products[1];

      return [
        {
          role: 'user',
          content: `Hola, quiero ${wanted.name} por favor.`,
        },
        {
          role: 'assistant',
          content: `¡Hola! ¿Quieres ${wrong.name}? Tenemos disponible a ${formatPrice(wrong.price)}.`,
          reward: -1,
          rewardSource: 'correction',
        },
        {
          role: 'user',
          content: `No, no pedí ${wrong.name}. Dije ${wanted.name}.`,
        },
        {
          role: 'assistant',
          content: `¡Disculpa la confusión! ${wanted.name} está disponible a ${formatPrice(wanted.price)}. ¿Cuántos deseas?`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },

  // 13. Silence/abandoned conversation (neutral)
  {
    type: 'pricing',
    applicableTo: ['polleria', 'bodega', 'ferreteria', 'tienda', 'salon'],
    generateTurns: (biz, _name) => {
      const product = pick(biz.products);

      return [
        {
          role: 'user',
          content: `¿Cuánto cuesta ${product.name}?`,
        },
        {
          role: 'assistant',
          content: `${product.name} cuesta ${formatPrice(product.price)}. ¿Deseas hacer un pedido?`,
          reward: 0,
          rewardSource: 'silence',
        },
      ];
    },
  },

  // 14. Hours/location inquiry
  {
    type: 'pricing',
    applicableTo: ['polleria', 'bodega', 'salon', 'ferreteria', 'tienda'],
    generateTurns: (biz, _name) => {
      return [
        {
          role: 'user',
          content: `Hola, ¿cuál es su horario de atención? ¿Dónde queda su local?`,
        },
        {
          role: 'assistant',
          content: `¡Hola! Nuestro horario en ${biz.businessName}:\n\n🕐 Lunes a Sábado: 9:00 AM - 8:00 PM\n🕐 Domingo: 10:00 AM - 5:00 PM\n\n¿En qué más puedo ayudarte?`,
          reward: 1,
          rewardSource: 'explicit',
        },
      ];
    },
  },
];

// ── Generator ──

interface OutputTrajectory {
  sessionId: string;
  turns: Array<{
    role: string;
    content: string;
    reward?: number;
    rewardSource?: string;
  }>;
  completedAt: number;
}

function generateTrajectory(index: number): OutputTrajectory | null {
  // Pick a random business
  const biz = pick(BUSINESSES);

  // Pick a scenario applicable to this business
  const applicable = SCENARIOS.filter((s) => s.applicableTo.includes(biz.tenantKey));
  if (applicable.length === 0) return null;

  const scenario = pick(applicable);
  const { name: customerName } = randomCustomerName();

  // Generate turns
  const rawTurns = scenario.generateTurns(biz, customerName);
  if (rawTurns.length === 0) return null;

  // Apply PII scrubbing
  const scrubbedTurns = rawTurns.map((turn) => ({
    role: turn.role,
    content: scrubPII(turn.content),
    ...(turn.reward !== undefined ? { reward: turn.reward, rewardSource: turn.rewardSource } : {}),
  }));

  return {
    sessionId: `synthetic_${biz.tenantKey}_${scenario.type}_${index}_${Date.now()}`,
    turns: scrubbedTurns,
    completedAt: Date.now(),
  };
}

// ── Main ──

function main(): void {
  console.log(`\n📊 Generating ${TRAJECTORY_COUNT} synthetic RL training trajectories...\n`);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  const trajectories: OutputTrajectory[] = [];
  let attempts = 0;
  const maxAttempts = TRAJECTORY_COUNT * 3;

  while (trajectories.length < TRAJECTORY_COUNT && attempts < maxAttempts) {
    const traj = generateTrajectory(trajectories.length);
    if (traj) trajectories.push(traj);
    attempts++;
  }

  // Write JSONL
  const lines = trajectories.map((t) => JSON.stringify(t)).join('\n');
  fs.writeFileSync(OUTPUT_FILE, lines + '\n');

  // Stats
  const totalTurns = trajectories.reduce((s, t) => s + t.turns.length, 0);
  const scoredTurns = trajectories.reduce(
    (s, t) => s + t.turns.filter((turn) => turn.reward !== undefined).length,
    0,
  );
  const positiveRewards = trajectories.reduce(
    (s, t) => s + t.turns.filter((turn) => turn.reward === 1).length,
    0,
  );
  const negativeRewards = trajectories.reduce(
    (s, t) => s + t.turns.filter((turn) => turn.reward === -1).length,
    0,
  );
  const neutralRewards = trajectories.reduce(
    (s, t) => s + t.turns.filter((turn) => turn.reward === 0).length,
    0,
  );

  // Count by scenario type
  const scenarioCounts: Record<string, number> = {};
  for (const t of trajectories) {
    const type = t.sessionId.split('_')[2];
    scenarioCounts[type] = (scenarioCounts[type] || 0) + 1;
  }

  // Count by business
  const bizCounts: Record<string, number> = {};
  for (const t of trajectories) {
    const biz = t.sessionId.split('_')[1];
    bizCounts[biz] = (bizCounts[biz] || 0) + 1;
  }

  console.log(`✅ Generated ${trajectories.length} trajectories\n`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log(`📏 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB\n`);
  console.log(`📈 Statistics:`);
  console.log(`   Total turns: ${totalTurns}`);
  console.log(`   Scored turns: ${scoredTurns}`);
  console.log(`   Rewards: +1=${positiveRewards}, 0=${neutralRewards}, -1=${negativeRewards}\n`);
  console.log(`📦 By business:`);
  for (const [biz, count] of Object.entries(bizCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${biz}: ${count}`);
  }
  console.log(`\n🎯 By scenario:`);
  for (const [type, count] of Object.entries(scenarioCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${type}: ${count}`);
  }
  console.log('');
}

main();
