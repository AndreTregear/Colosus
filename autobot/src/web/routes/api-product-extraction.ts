import { Router } from 'express';
import multer from 'multer';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import * as productsRepo from '../../db/products-repo.js';
import { extractProductsFromVoice, extractProductsFromText, type ExtractedProduct } from '../../ai/product-extraction.js';
import { MAX_UPLOAD_SIZE_MB } from '../../config.js';
import { logger } from '../../shared/logger.js';
import { getRedisConnection } from '../../queue/redis.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

const router = Router();
router.use(requireMobileOrDeviceAuth);

interface ProductFromVoiceResponse {
  status: 'complete' | 'needs_clarification' | 'error';
  transcription?: string;
  products?: ExtractedProduct[];
  clarifyingQuestion?: string;
  missingFields?: string[];
  sessionId: string;
  createdCount?: number;
}

// Multi-turn extraction sessions live in Redis with a 10-minute TTL.
// Key: `prodext:<sessionId>`. The previous in-memory Map grew unbounded
// (DoS vector) and didn't survive restarts or share across processes.
interface ExtractionSession {
  tenantId: string;
  transcription: string;
  extractedProducts: ExtractedProduct[];
  context: string;
  createdAt: number;
}

const SESSION_TTL_SEC = 10 * 60;

async function getSession(sessionId: string): Promise<ExtractionSession | null> {
  const raw = await getRedisConnection().get(`prodext:${sessionId}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as ExtractionSession; } catch { return null; }
}

async function setSession(sessionId: string, session: ExtractionSession): Promise<void> {
  await getRedisConnection().set(`prodext:${sessionId}`, JSON.stringify(session), 'EX', SESSION_TTL_SEC);
}

async function deleteSession(sessionId: string): Promise<void> {
  await getRedisConnection().del(`prodext:${sessionId}`);
}

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
      // Cap batch size — defends against DoS via huge payload.
      if (confirmedProducts.length > 50) {
        res.status(400).json({ error: 'Too many products in one request (max 50)' });
        return;
      }
      const createdProducts = [];
      for (const product of confirmedProducts) {
        // Validate every field — never spread user-supplied data into the
        // create call. Prevents mass-assignment of internal fields and
        // ensures price/strings are well-formed.
        if (!product || typeof product !== 'object') {
          res.status(400).json({ error: 'Each product must be an object' });
          return;
        }
        const name = typeof product.name === 'string' ? product.name.trim().slice(0, 200) : '';
        if (!name) {
          res.status(400).json({ error: 'Product name is required' });
          return;
        }
        const price = Number(product.price);
        if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
          res.status(400).json({ error: `Invalid price for "${name}"` });
          return;
        }
        const description = typeof product.description === 'string' ? product.description.slice(0, 2000) : '';
        const category = typeof product.category === 'string' ? product.category.trim().slice(0, 100) : 'General';

        const created = await productsRepo.createProduct(tenantId, {
          name,
          description,
          price,
          category: category || 'General',
          productType: 'physical',
          stock: null,
          imageUrl: null,
          active: true,
        });
        createdProducts.push(created);
      }

      // Clear session
      if (existingSessionId) {
        await deleteSession(existingSessionId);
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
    if (existingSessionId) {
      const session = await getSession(existingSessionId);
      if (session && session.tenantId === tenantId) {
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
      await setSession(newSessionId, {
        tenantId,
        transcription: extractionResult.rawTranscription,
        extractedProducts: extractionResult.products || [],
        context: previousContext
          ? `${previousContext}\n${extractionResult.rawTranscription}`
          : extractionResult.rawTranscription,
        createdAt: Date.now(),
      });
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
