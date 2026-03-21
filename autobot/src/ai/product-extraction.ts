import { getAIClient, getModelId } from './client.js';

export interface ExtractedProduct {
  name: string;
  description?: string;
  price: number;
  category?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  priceAdjustment: number;
}

export interface ProductExtractionResult {
  status: 'complete' | 'needs_clarification' | 'error';
  products?: ExtractedProduct[];
  clarifyingQuestion?: string;
  missingFields?: string[];
  rawTranscription: string;
}

const EXTRACTION_PROMPT = `You are a product extraction assistant for a WhatsApp commerce platform.

Extract product information from the merchant's voice description. Be conversational and warm.

Rules:
1. Extract ALL products mentioned
2. For each product capture: name (required), price (required), description (optional), category (optional), variants/options (optional)
3. If information is missing or unclear, ask a clarifying question
4. Detect variants/options naturally mentioned (e.g., "con papas al hilo o fritas", "de pollo, carne o queso")
5. Price must be a number (assume local currency)

Examples:
Input: "empanadas de pollo a 3 soles"
Output: { "products": [{"name": "Empanada de pollo", "price": 3, "category": "Empanadas"}], "status": "complete" }

Input: "hamburguesa"
Output: { "status": "needs_clarification", "clarifyingQuestion": "¿Qué tipo de hamburguesa? ¿Con qué ingredientes y a qué precio?", "missingFields": ["price", "description"] }

Input: "combo de alitas con papas"
Output: { "status": "needs_clarification", "clarifyingQuestion": "¿Qué incluye el combo exactamente? ¿Alitas con qué salsas, y las papas son al hilo o fritas? ¿A qué precio?", "missingFields": ["price", "variants"] }

Respond ONLY in JSON format with this structure:
{
  "status": "complete" | "needs_clarification",
  "products": [...],
  "clarifyingQuestion": "...",
  "missingFields": [...]
}`;

export async function extractProductsFromText(text: string, context?: string): Promise<ProductExtractionResult> {
  const client = getAIClient();
  
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: EXTRACTION_PROMPT },
    { 
      role: 'user', 
      content: context 
        ? `Previous context: ${context}\n\nNew input: ${text}`
        : text 
    },
  ];

  const response = await client.chat.completions.create({
    model: getModelId(),
    messages,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      status: 'error',
      rawTranscription: text,
    };
  }

  try {
    const result = JSON.parse(content) as Omit<ProductExtractionResult, 'rawTranscription'>;
    return {
      ...result,
      rawTranscription: text,
    };
  } catch {
    return {
      status: 'error',
      rawTranscription: text,
    };
  }
}

export async function extractProductsFromVoice(audioBuffer: Buffer, mimetype: string): Promise<ProductExtractionResult> {
  const { transcribeAudio } = await import('./client.js');
  const transcription = await transcribeAudio(audioBuffer, mimetype);
  return extractProductsFromText(transcription);
}
