import OpenAI from 'openai';
import type { Response } from 'express';
import * as db from './db.js';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000/v1';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'qwen3.5-35b-a3b';

const client = new OpenAI({ baseURL: AI_API_URL, apiKey: AI_API_KEY });

// ── Tool definitions for the LLM ──────────────────────────────

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_revenue',
      description: 'Obtener ingresos del negocio en un rango de fechas',
      parameters: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['today', 'week', 'month'], description: 'Rango de tiempo' }
        },
        required: ['range']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_expenses',
      description: 'Obtener gastos del negocio en un rango de fechas',
      parameters: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['today', 'week', 'month'], description: 'Rango de tiempo' }
        },
        required: ['range']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_products',
      description: 'Listar todos los productos del negocio con sus precios',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_orders',
      description: 'Listar pedidos recientes con su estado',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], description: 'Filtrar por estado (opcional)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_payments',
      description: 'Ver pagos pendientes de Yape',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_top_products',
      description: 'Obtener los productos más vendidos',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Cantidad de productos (default 5)' }
        }
      }
    }
  }
];

// ── Tool execution ────────────────────────────────────────────

function dateRange(range: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: string;
  if (range === 'today') {
    start = end;
  } else if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    start = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    start = d.toISOString().slice(0, 10);
  }
  return { start, end };
}

function executeTool(name: string, args: any, userId: string): string {
  switch (name) {
    case 'get_revenue': {
      const { start, end } = dateRange(args.range || 'today');
      const data = db.getRevenueTotal(userId, start, end);
      const daily = db.getRevenue(userId, start, end);
      return JSON.stringify({ revenue: data.revenue, order_count: data.order_count, daily, range: args.range });
    }
    case 'get_expenses': {
      const { start, end } = dateRange(args.range || 'today');
      const total = db.getExpensesTotal(userId, start, end);
      const byCategory = db.getExpensesByCategory(userId, start, end);
      return JSON.stringify({ total: total.total, by_category: byCategory, range: args.range });
    }
    case 'list_products': {
      const products = db.getProducts(userId);
      return JSON.stringify(products.map(p => ({ name: p.name, price: p.price, stock: p.stock, category: p.category })));
    }
    case 'list_orders': {
      const orders = db.getOrders(userId, args.status);
      return JSON.stringify(orders.slice(0, 20).map(o => ({
        id: o.id, customer: o.customer_name, total: o.total, status: o.status, date: o.created_at
      })));
    }
    case 'check_payments': {
      const payments = db.getPendingPayments(userId);
      return JSON.stringify(payments.map(p => ({ id: p.id, sender: p.sender_name, amount: p.amount, date: p.captured_at })));
    }
    case 'get_top_products': {
      const { start, end } = dateRange('month');
      const top = db.getTopProducts(userId, start, end, args.limit || 5);
      return JSON.stringify(top);
    }
    default:
      return JSON.stringify({ error: `Herramienta desconocida: ${name}` });
  }
}

// ── System prompt builder ─────────────────────────────────────

function buildSystemPrompt(userId: string): string {
  const user = db.getUserById(userId);
  const products = db.getProducts(userId);
  const productList = products.map(p => `- ${p.name}: S/${p.price}`).join('\n');

  return `Eres Yaya, la asistente de inteligencia artificial para negocios pequeños en Perú.
Trabajas para ${user?.business_name || 'el negocio'} en ${user?.city || 'Perú'}.

Tu rol es ayudar al dueño del negocio con:
- Consultas sobre ventas, ingresos y gastos
- Gestión de pedidos y productos
- Verificación de pagos por Yape
- Consejos de negocio prácticos

Productos actuales:
${productList || '(sin productos registrados)'}

Reglas:
- Responde SIEMPRE en español peruano, amigable y conciso
- Usa moneda peruana (S/ soles)
- Si el usuario pregunta por datos del negocio, usa las herramientas disponibles para consultar la base de datos
- Cuando muestres datos financieros, incluye un resumen claro con los números
- Si no tienes información suficiente, dilo honestamente
- Sé proactivo: sugiere acciones cuando veas oportunidades o problemas`;
}

// ── Chat (non-streaming) ──────────────────────────────────────

export async function chat(userId: string, userMessage: string): Promise<{ role: string; content: string; metadata?: any }> {
  const recentMessages = db.getAgentMessages(userId, 20, 0).reverse();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(userId) },
    ...recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ];

  let response = await client.chat.completions.create({
    model: AI_MODEL,
    messages,
    tools,
    temperature: 0.7,
    max_tokens: 2048,
  });

  let assistantMessage = response.choices[0]?.message;
  let iterations = 0;
  const maxIterations = 5;

  // Handle tool calls in a loop
  while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < maxIterations) {
    iterations++;
    messages.push(assistantMessage as any);

    for (const tc of assistantMessage.tool_calls) {
      const args = JSON.parse(tc.function.arguments || '{}');
      const result = executeTool(tc.function.name, args, userId);
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      } as any);
    }

    response = await client.chat.completions.create({
      model: AI_MODEL,
      messages,
      tools,
      temperature: 0.7,
      max_tokens: 2048,
    });
    assistantMessage = response.choices[0]?.message;
  }

  const content = assistantMessage?.content || 'Lo siento, no pude procesar tu consulta.';
  return { role: 'assistant', content };
}

// ── Chat (streaming via SSE) ──────────────────────────────────

export async function chatStream(userId: string, userMessage: string, res: Response): Promise<void> {
  const recentMessages = db.getAgentMessages(userId, 20, 0).reverse();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(userId) },
    ...recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ];

  // First, do a non-streaming call to handle tool calls
  let toolResponse = await client.chat.completions.create({
    model: AI_MODEL,
    messages,
    tools,
    temperature: 0.7,
    max_tokens: 2048,
  });

  let assistantMsg = toolResponse.choices[0]?.message;
  let iterations = 0;

  while (assistantMsg?.tool_calls && assistantMsg.tool_calls.length > 0 && iterations < 5) {
    iterations++;
    messages.push(assistantMsg as any);

    for (const tc of assistantMsg.tool_calls) {
      const args = JSON.parse(tc.function.arguments || '{}');
      const result = executeTool(tc.function.name, args, userId);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result } as any);
    }

    toolResponse = await client.chat.completions.create({
      model: AI_MODEL,
      messages,
      tools,
      temperature: 0.7,
      max_tokens: 2048,
    });
    assistantMsg = toolResponse.choices[0]?.message;
  }

  // If tool calls were resolved, we already have the final content — stream it as if we got it incrementally
  if (iterations > 0 && assistantMsg?.content) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    // Send the full content as a single event since tool calls already completed
    res.write(`data: ${JSON.stringify({ content: assistantMsg.content, done: false })}\n\n`);
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();

    // Save to DB
    const fullContent = assistantMsg.content;
    db.insertAgentMessage(crypto.randomUUID(), userId, 'user', userMessage);
    db.insertAgentMessage(crypto.randomUUID(), userId, 'assistant', fullContent);
    return;
  }

  // No tool calls needed — stream directly
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = await client.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ content: delta, done: false })}\n\n`);
    }
  }
  res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
  res.end();

  // Save both messages to DB
  db.insertAgentMessage(crypto.randomUUID(), userId, 'user', userMessage);
  db.insertAgentMessage(crypto.randomUUID(), userId, 'assistant', fullContent);
}
