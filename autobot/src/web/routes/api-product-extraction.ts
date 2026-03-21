import { Router } from 'express';
import multer from 'multer';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import * as productsRepo from '../../db/products-repo.js';
import { extractProductsFromVoice, extractProductsFromText, type ExtractedProduct } from '../../ai/product-extraction.js';
import { MAX_UPLOAD_SIZE_MB } from '../../config.js';
import { logger } from '../../shared/logger.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

const router = Router();
router.use(requireMobileOrDeviceAuth);

interface ProductFromVoiceRequest {
  audio?: Buffer;
  text?: string;
  sessionId?: string;
  previousContext?: string;
  confirmedProducts?: ExtractedProduct[];
}

interface ProductFromVoiceResponse {
  status: 'complete' | 'needs_clarification' | 'error';
  transcription?: string;
  products?: ExtractedProduct[];
  clarifyingQuestion?: string;
  missingFields?: string[];
  sessionId: string;
  createdCount?: number;
}

// Store ongoing sessions (in production, use Redis)
const sessions = new Map<string, {
  tenantId: string;
  transcription: string;
  extractedProducts: ExtractedProduct[];
  context: string;
  createdAt: Date;
}>();

/**
 * POST /api/v1/mobile/products/from-voice
 * 
 * Extract products from voice/audio or text input.
 * Supports multi-turn conversations for clarification.
 * 
 * Request Body (multipart/form-data):
 * - audio: Audio file (optional if text provided)
 * - text: Text description (optional if audio provided)
 * - sessionId: Previous session ID for multi-turn (optional)
 * - previousContext: Previous context for clarification (optional)
 * - confirmedProducts: Already confirmed products to save (optional)
 * 
 * Response:
 * {
 *   status: 'complete' | 'needs_clarification' | 'error',
 *   transcription?: string,
 *   products?: [{ name, price, description?, category?, variants?[] }],
 *   clarifyingQuestion?: string,
 *   missingFields?: string[],
 *   sessionId: string,
 *   createdCount?: number
 * }
 * 
 * Flow:
 * 1. Merchant sends voice: "empanadas"
 * 2. Response: { status: 'needs_clarification', clarifyingQuestion: '¿De qué sabor y a qué precio?', sessionId: 'abc123' }
 * 3. Merchant replies: "de pollo, 3 soles cada una"
 * 4. Response: { status: 'complete', products: [{ name: 'Empanada de pollo', price: 3 }], sessionId: 'abc123' }
 * 5. Merchant sends confirmedProducts to save them
 */
router.post('/from-voice', upload.single('audio'), async (req, res) => {
  const tenantId = getTenantId(req);
  const { text, sessionId: existingSessionId, confirmedProducts } = req.body;
  const audioFile = req.file;

  try {
    // Handle confirmed products save
    if (confirmedProducts && Array.isArray(confirmedProducts)) {
      const createdProducts = [];
      for (const product of confirmedProducts) {
        const created = await productsRepo.createProduct(tenantId, {
          name: product.name,
          description: product.description || '',
          price: product.price,
          category: product.category || 'General',
          productType: 'physical',
          stock: null,
          imageUrl: null,
          active: true,
        });
        createdProducts.push(created);
      }

      // Clear session
      if (existingSessionId) {
        sessions.delete(existingSessionId);
      }

      const response: ProductFromVoiceResponse = {
        status: 'complete',
        sessionId: existingSessionId || generateSessionId(),
        createdCount: createdProducts.length,
        products: createdProducts,
      };

      res.json(response);
      return;
    }

    // Get previous context if session exists
    let previousContext = '';
    if (existingSessionId && sessions.has(existingSessionId)) {
      const session = sessions.get(existingSessionId)!;
      if (session.tenantId === tenantId) {
        previousContext = session.context;
      }
    }

    // Extract from audio or text
    let extractionResult;
    if (audioFile) {
      extractionResult = await extractProductsFromVoice(audioFile.buffer, audioFile.mimetype);
    } else if (text) {
      extractionResult = await extractProductsFromText(text, previousContext || undefined);
    } else {
      res.status(400).json({ error: 'Provide either audio file or text' });
      return;
    }

    // Generate or reuse session ID
    const newSessionId = existingSessionId || generateSessionId();

    // Store session for multi-turn
    if (extractionResult.status === 'needs_clarification' || extractionResult.products) {
      sessions.set(newSessionId, {
        tenantId,
        transcription: extractionResult.rawTranscription,
        extractedProducts: extractionResult.products || [],
        context: previousContext 
          ? `${previousContext}\n${extractionResult.rawTranscription}`
          : extractionResult.rawTranscription,
        createdAt: new Date(),
      });

      // Clean up old sessions (older than 10 minutes)
      cleanupOldSessions();
    }

    const response: ProductFromVoiceResponse = {
      status: extractionResult.status,
      transcription: extractionResult.rawTranscription,
      products: extractionResult.products,
      clarifyingQuestion: extractionResult.clarifyingQuestion,
      missingFields: extractionResult.missingFields,
      sessionId: newSessionId,
    };

    logger.info({ 
      tenantId, 
      status: extractionResult.status,
      productsCount: extractionResult.products?.length || 0,
    }, 'Product extraction from voice');

    res.json(response);

  } catch (error) {
    logger.error({ error, tenantId }, 'Error extracting products from voice');
    res.status(500).json({ 
      status: 'error',
      sessionId: existingSessionId || generateSessionId(),
      error: 'Failed to process voice input',
    });
  }
});

/**
 * POST /api/v1/mobile/products/from-photo
 * 
 * Extract products from product photo with optional voice description.
 * 
 * Request Body (multipart/form-data):
 * - image: Product image (required)
 * - description: Text description or voice transcription (optional)
 * 
 * Response:
 * {
 *   status: 'complete' | 'needs_clarification' | 'error',
 *   products?: [{ name, price?, description?, category? }],
 *   clarifyingQuestion?: string,
 *   suggestedName?: string,
 *   suggestedPrice?: number,
 *   confidence: 'high' | 'medium' | 'low'
 * }
 */
router.post('/from-photo', upload.single('image'), async (req, res) => {
  const tenantId = getTenantId(req);
  const { description } = req.body;
  const imageFile = req.file;

  if (!imageFile) {
    res.status(400).json({ error: 'Product image is required' });
    return;
  }

  try {
    const result = await extractProductFromImage(imageFile.buffer, description);

    logger.info({ 
      tenantId, 
      status: result.status,
      confidence: result.confidence,
    }, 'Product extraction from photo');

    res.json(result);

  } catch (error) {
    logger.error({ error, tenantId }, 'Error extracting product from photo');
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to process product photo',
    });
  }
});

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function cleanupOldSessions(): void {
  const cutoff = Date.now() - 10 * 60 * 1000; // 10 minutes
  for (const [id, session] of sessions.entries()) {
    if (session.createdAt.getTime() < cutoff) {
      sessions.delete(id);
    }
  }
}

async function extractProductFromImage(
  imageBuffer: Buffer, 
  description?: string
): Promise<{
  status: 'complete' | 'needs_clarification' | 'error';
  products?: ExtractedProduct[];
  clarifyingQuestion?: string;
  confidence: 'high' | 'medium' | 'low';
}> {
  const { getVisionClient, getVisionModelId } = await import('../../ai/client.js');
  const client = getVisionClient();

  const prompt = `Analyze this product image and extract information.
${description ? `Additional description: "${description}"` : ''}

Extract:
1. Product name (what is this?)
2. Estimated price if visible
3. Brief description
4. Category

Be conversational. If you can't identify the product clearly, ask for clarification.

Respond in JSON:
{
  "productName": "...",
  "estimatedPrice": number or null,
  "description": "...",
  "category": "...",
  "confidence": "high" | "medium" | "low",
  "needsClarification": boolean,
  "clarifyingQuestion": "..."
}`;

  try {
    const base64Image = imageBuffer.toString('base64');
    const response = await client.chat.completions.create({
      model: getVisionModelId(),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        status: 'error',
        confidence: 'low',
      };
    }

    const result = JSON.parse(content);
    
    if (result.needsClarification) {
      return {
        status: 'needs_clarification',
        clarifyingQuestion: result.clarifyingQuestion,
        confidence: result.confidence,
        products: result.productName ? [{
          name: result.productName,
          price: result.estimatedPrice || 0,
          description: result.description || '',
          category: result.category || 'General',
        }] : undefined,
      };
    }

    return {
      status: 'complete',
      confidence: result.confidence,
      products: [{
        name: result.productName,
        price: result.estimatedPrice || 0,
        description: result.description || '',
        category: result.category || 'General',
      }],
    };

  } catch (error) {
    logger.error({ error }, 'Vision API error');
    return {
      status: 'error',
      confidence: 'low',
    };
  }
}

export { router as productExtractionRouter };
