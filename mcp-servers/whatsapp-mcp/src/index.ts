#!/usr/bin/env node
/**
 * WhatsApp Outbound MCP Server
 * Enables agents to send proactive WhatsApp messages via OpenClaw gateway.
 *
 * Tools:
 *  - send_message: Send a text message to a WhatsApp number
 *  - send_media: Send an image/document with optional caption
 *  - send_template_message: Send a pre-formatted template message
 *  - get_chat_history: Get recent messages with a specific contact
 *  - check_online_status: Check if gateway is connected and number is linked
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// ── Configuration ────────────────────────────────────

const OPENCLAW_GATEWAY_URL =
  process.env.OPENCLAW_GATEWAY_URL || "http://localhost:3284";
const WHATSAPP_ACCOUNT = process.env.WHATSAPP_ACCOUNT || "default";
const REQUEST_TIMEOUT_MS = 15_000;

// ── Gateway HTTP Client ──────────────────────────────

interface GatewayResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function gatewayFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<GatewayResponse> {
  const url = `${OPENCLAW_GATEWAY_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try {
        const parsed = JSON.parse(text);
        detail = parsed.error || parsed.message || text;
      } catch {
        // raw text
      }
      throw new Error(`Gateway ${res.status}: ${detail}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      const data = await res.json();
      return { success: true, data };
    }
    return { success: true };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error(`Gateway request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

// ── CLI Fallback ─────────────────────────────────────

async function sendViaCli(
  phone: string,
  message: string
): Promise<GatewayResponse> {
  try {
    const { stdout, stderr } = await execFileAsync("openclaw", [
      "send",
      "--channel",
      "whatsapp",
      "--to",
      phone,
      "--message",
      message,
    ], { timeout: REQUEST_TIMEOUT_MS });
    return {
      success: true,
      data: { output: stdout.trim(), stderr: stderr.trim() || undefined },
    };
  } catch (err: any) {
    throw new Error(`OpenClaw CLI failed: ${err.message}`);
  }
}

// ── Phone Number Validation ──────────────────────────

function normalizePhone(phone: string): string {
  // Strip spaces, dashes, parens
  let cleaned = phone.replace(/[\s\-()]/g, "");
  // Ensure + prefix for E.164
  if (!cleaned.startsWith("+") && /^\d{10,15}$/.test(cleaned)) {
    cleaned = `+${cleaned}`;
  }
  if (!/^\+\d{10,15}$/.test(cleaned)) {
    throw new Error(
      `Invalid phone number "${phone}". Use E.164 format (e.g., +51999888777).`
    );
  }
  return cleaned;
}

// ── Types ────────────────────────────────────────────

interface TemplateVars {
  [key: string]: string;
}

interface MessageResult {
  success: boolean;
  message_id?: string;
  phone: string;
  timestamp: string;
  error?: string;
}

// ── Tool Definitions ─────────────────────────────────

const TOOLS = [
  {
    name: "send_message",
    description:
      "Send a text message to a WhatsApp number. The number must be in E.164 format (e.g., +51999888777).",
    inputSchema: {
      type: "object" as const,
      properties: {
        phone_number: {
          type: "string",
          description: "Recipient phone number in E.164 format (e.g., +51999888777)",
        },
        message_text: {
          type: "string",
          description: "Message text to send",
        },
      },
      required: ["phone_number", "message_text"],
    },
  },
  {
    name: "send_media",
    description:
      "Send an image, document, or other media file to a WhatsApp number. Provide a publicly accessible URL for the media.",
    inputSchema: {
      type: "object" as const,
      properties: {
        phone_number: {
          type: "string",
          description: "Recipient phone number in E.164 format",
        },
        media_url: {
          type: "string",
          description: "Publicly accessible URL of the media file (image, PDF, etc.)",
        },
        caption: {
          type: "string",
          description: "Caption for the media (optional)",
        },
        media_type: {
          type: "string",
          enum: ["image", "document", "audio", "video"],
          description: "Type of media (default: auto-detected from URL)",
        },
      },
      required: ["phone_number", "media_url"],
    },
  },
  {
    name: "send_template_message",
    description:
      "Send a pre-formatted template message (appointment reminder, payment reminder, order confirmation). Template variables are filled in dynamically.",
    inputSchema: {
      type: "object" as const,
      properties: {
        phone_number: {
          type: "string",
          description: "Recipient phone number in E.164 format",
        },
        template_name: {
          type: "string",
          enum: [
            "appointment_reminder",
            "payment_reminder",
            "order_confirmation",
            "shipping_update",
            "welcome",
            "custom",
          ],
          description: "Template name",
        },
        template_vars: {
          type: "object",
          description:
            "Key-value pairs for template variables (e.g., {customer_name: 'Juan', amount: '150.00'})",
          additionalProperties: { type: "string" },
        },
        language: {
          type: "string",
          description: "Message language (default: es)",
        },
      },
      required: ["phone_number", "template_name", "template_vars"],
    },
  },
  {
    name: "get_chat_history",
    description:
      "Get recent messages exchanged with a specific WhatsApp contact. Returns both sent and received messages.",
    inputSchema: {
      type: "object" as const,
      properties: {
        phone_number: {
          type: "string",
          description: "Contact phone number in E.164 format",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 20)",
        },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "check_online_status",
    description:
      "Check if the WhatsApp gateway is connected and the linked number is online. Returns connection status and account info.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ── Built-in Templates ───────────────────────────────

function renderTemplate(
  templateName: string,
  vars: TemplateVars,
  language: string = "es"
): string {
  const templates: Record<string, Record<string, string>> = {
    appointment_reminder: {
      es: `Hola ${vars.customer_name || ""},\n\nLe recordamos su cita el ${vars.date || ""} a las ${vars.time || ""}${vars.service ? ` para ${vars.service}` : ""}${vars.location ? ` en ${vars.location}` : ""}.\n\nPara confirmar, responda "OK". Para reprogramar, responda "CAMBIAR".\n\nGracias.`,
      en: `Hi ${vars.customer_name || ""},\n\nThis is a reminder of your appointment on ${vars.date || ""} at ${vars.time || ""}${vars.service ? ` for ${vars.service}` : ""}${vars.location ? ` at ${vars.location}` : ""}.\n\nReply "OK" to confirm or "RESCHEDULE" to change.\n\nThank you.`,
    },
    payment_reminder: {
      es: `Hola ${vars.customer_name || ""},\n\nLe recordamos que tiene un pago pendiente de S/${vars.amount || "0.00"} por el pedido ${vars.order_id || ""}.\n\nPuede pagar por:\n• Yape/Plin al ${vars.payment_phone || ""}\n• Transferencia bancaria\n\nSi ya realizó el pago, envíenos el comprobante.\n\nGracias.`,
      en: `Hi ${vars.customer_name || ""},\n\nThis is a reminder that you have a pending payment of $${vars.amount || "0.00"} for order ${vars.order_id || ""}.\n\nIf you've already paid, please send us the receipt.\n\nThank you.`,
    },
    order_confirmation: {
      es: `¡Pedido confirmado! 🎉\n\nPedido: ${vars.order_id || ""}\nTotal: S/${vars.amount || "0.00"}\n${vars.items ? `Artículos: ${vars.items}` : ""}\n${vars.delivery_date ? `Entrega estimada: ${vars.delivery_date}` : ""}\n\nGracias por su compra, ${vars.customer_name || ""}.`,
      en: `Order confirmed! 🎉\n\nOrder: ${vars.order_id || ""}\nTotal: $${vars.amount || "0.00"}\n${vars.items ? `Items: ${vars.items}` : ""}\n${vars.delivery_date ? `Estimated delivery: ${vars.delivery_date}` : ""}\n\nThank you for your purchase, ${vars.customer_name || ""}.`,
    },
    shipping_update: {
      es: `Actualización de envío 📦\n\nPedido: ${vars.order_id || ""}\nEstado: ${vars.status || ""}\n${vars.tracking_number ? `Seguimiento: ${vars.tracking_number}` : ""}\n${vars.carrier ? `Transportista: ${vars.carrier}` : ""}\n\n${vars.customer_name || ""}, le avisaremos cuando llegue.`,
      en: `Shipping update 📦\n\nOrder: ${vars.order_id || ""}\nStatus: ${vars.status || ""}\n${vars.tracking_number ? `Tracking: ${vars.tracking_number}` : ""}\n${vars.carrier ? `Carrier: ${vars.carrier}` : ""}\n\n${vars.customer_name || ""}, we'll notify you on delivery.`,
    },
    welcome: {
      es: `¡Bienvenido/a ${vars.customer_name || ""}! 👋\n\nGracias por contactarnos. Estamos aquí para ayudarle.\n\n¿En qué podemos servirle hoy?`,
      en: `Welcome ${vars.customer_name || ""}! 👋\n\nThank you for reaching out. We're here to help.\n\nHow can we assist you today?`,
    },
  };

  if (templateName === "custom") {
    return vars.message || vars.text || "";
  }

  const template = templates[templateName];
  if (!template) {
    throw new Error(
      `Unknown template "${templateName}". Available: ${Object.keys(templates).join(", ")}, custom`
    );
  }

  const msg = template[language] || template["es"];
  if (!msg) {
    throw new Error(`Template "${templateName}" not available in language "${language}".`);
  }
  return msg;
}

// ── Tool Handlers ────────────────────────────────────

async function handleTool(
  name: string,
  args: Record<string, any>
): Promise<string> {
  switch (name) {
    case "send_message": {
      const phone = normalizePhone(args.phone_number);
      const text = args.message_text;

      if (!text || text.trim().length === 0) {
        throw new Error("message_text cannot be empty.");
      }

      let result: MessageResult;

      try {
        // Try gateway HTTP API first
        const res = await gatewayFetch(
          `/api/sessions/${WHATSAPP_ACCOUNT}/send`,
          {
            method: "POST",
            body: JSON.stringify({
              to: phone,
              type: "text",
              text: { body: text },
            }),
          }
        );

        result = {
          success: true,
          message_id: res.data?.id || res.data?.message_id,
          phone,
          timestamp: new Date().toISOString(),
        };
      } catch (gatewayErr: any) {
        // Fallback to CLI
        try {
          const cliRes = await sendViaCli(phone, text);
          result = {
            success: true,
            phone,
            timestamp: new Date().toISOString(),
            message_id: cliRes.data?.output,
          };
        } catch (cliErr: any) {
          throw new Error(
            `Gateway failed: ${gatewayErr.message}. CLI fallback also failed: ${cliErr.message}`
          );
        }
      }

      return JSON.stringify(result, null, 2);
    }

    case "send_media": {
      const phone = normalizePhone(args.phone_number);
      const mediaUrl = args.media_url;

      if (!mediaUrl) {
        throw new Error("media_url is required.");
      }

      // Auto-detect media type from URL extension
      let mediaType = args.media_type;
      if (!mediaType) {
        const ext = mediaUrl.split("?")[0].split(".").pop()?.toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
          mediaType = "image";
        } else if (["mp4", "mov", "avi"].includes(ext || "")) {
          mediaType = "video";
        } else if (["mp3", "ogg", "wav"].includes(ext || "")) {
          mediaType = "audio";
        } else {
          mediaType = "document";
        }
      }

      const payload: Record<string, any> = {
        to: phone,
        type: mediaType,
      };

      // Structure the media payload according to WhatsApp API conventions
      payload[mediaType] = {
        url: mediaUrl,
        ...(args.caption ? { caption: args.caption } : {}),
      };

      const res = await gatewayFetch(
        `/api/sessions/${WHATSAPP_ACCOUNT}/send`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const result: MessageResult = {
        success: true,
        message_id: res.data?.id || res.data?.message_id,
        phone,
        timestamp: new Date().toISOString(),
      };

      return JSON.stringify(result, null, 2);
    }

    case "send_template_message": {
      const phone = normalizePhone(args.phone_number);
      const vars: TemplateVars = args.template_vars || {};
      const language = args.language || "es";

      const messageText = renderTemplate(
        args.template_name,
        vars,
        language
      );

      if (!messageText) {
        throw new Error("Template rendered to empty message.");
      }

      // Send as a regular text message (templates are rendered locally)
      let result: MessageResult;

      try {
        const res = await gatewayFetch(
          `/api/sessions/${WHATSAPP_ACCOUNT}/send`,
          {
            method: "POST",
            body: JSON.stringify({
              to: phone,
              type: "text",
              text: { body: messageText },
              metadata: {
                template: args.template_name,
                template_vars: vars,
              },
            }),
          }
        );

        result = {
          success: true,
          message_id: res.data?.id || res.data?.message_id,
          phone,
          timestamp: new Date().toISOString(),
        };
      } catch (gatewayErr: any) {
        // Fallback to CLI
        try {
          const cliRes = await sendViaCli(phone, messageText);
          result = {
            success: true,
            phone,
            timestamp: new Date().toISOString(),
            message_id: cliRes.data?.output,
          };
        } catch (cliErr: any) {
          throw new Error(
            `Gateway failed: ${gatewayErr.message}. CLI fallback also failed: ${cliErr.message}`
          );
        }
      }

      return JSON.stringify(
        {
          ...result,
          template: args.template_name,
          rendered_message: messageText,
        },
        null,
        2
      );
    }

    case "get_chat_history": {
      const phone = normalizePhone(args.phone_number);
      const limit = args.limit || 20;

      const res = await gatewayFetch(
        `/api/sessions/${WHATSAPP_ACCOUNT}/chats/${encodeURIComponent(phone)}/messages?limit=${limit}`
      );

      const messages = res.data?.messages || res.data || [];

      return JSON.stringify(
        {
          phone,
          message_count: messages.length,
          messages,
        },
        null,
        2
      );
    }

    case "check_online_status": {
      const start = Date.now();
      const result: Record<string, any> = {
        gateway_url: OPENCLAW_GATEWAY_URL,
        account: WHATSAPP_ACCOUNT,
      };

      try {
        const res = await gatewayFetch(
          `/api/sessions/${WHATSAPP_ACCOUNT}/status`
        );

        result.latency_ms = Date.now() - start;
        result.gateway_reachable = true;
        result.session_status = res.data?.status || "unknown";
        result.connected = res.data?.status === "connected" ||
                           res.data?.status === "CONNECTED" ||
                           res.data?.connected === true;
        result.phone_number = res.data?.phone || res.data?.me?.id || null;
        result.name = res.data?.name || res.data?.pushName || null;
      } catch (err: any) {
        result.latency_ms = Date.now() - start;
        result.gateway_reachable = false;
        result.connected = false;
        result.error = err.message;
      }

      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ─────────────────────────────────

const server = new Server(
  { name: "whatsapp-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return { content: [{ type: "text", text: result }] };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ── Start ────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `WhatsApp MCP server running on stdio (gateway: ${OPENCLAW_GATEWAY_URL}, account: ${WHATSAPP_ACCOUNT})`
  );
}

main().catch(console.error);
