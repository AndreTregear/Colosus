# 🚀 Multi-Capability AI System

## Overview

This is a **modular, scalable, and cost-optimized AI architecture** that supports:
- ✅ Text chat (fast, cheap)
- ✅ Vision/image understanding (kimi-k2.5)
- ✅ OCR/text extraction
- ✅ Audio reasoning (qwen-omni)
- ✅ Video analysis
- ✅ Full multimodal capabilities
- ✅ **Comprehensive usage tracking & analytics**

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Orchestrator                         │
│          (Central entry point for all AI ops)               │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐
│ Smart Router │ │ Universal│ │ Token       │
│ (Capability  │ │ Media    │ │ Tracker     │
│  selection)  │ │ Decoder  │ │ (Analytics) │
└──────┬───────┘ └────┬─────┘ └──────┬──────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────┐
│         Unified AI Client Factory            │
│  (Separate clients per capability)          │
└─────────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Low-effort text client (cheap, fast)
AI_TEXT_MODEL=deepseek-chat
AI_TEXT_BASE_URL=https://api.deepseek.com/v1
AI_TEXT_API_KEY=your-deepseek-key
AI_TEXT_MAX_TOKENS=1024
AI_TEXT_TEMPERATURE=0.7

# Vision client (kimi-k2.5) - for images
AI_VISION_MODEL=kimi-k2.5
AI_VISION_BASE_URL=https://api.moonshot.cn/v1
AI_VISION_API_KEY=your-kimi-key
AI_VISION_MAX_TOKENS=4096
AI_VISION_TEMPERATURE=0.7

# OCR client (can reuse vision config)
AI_OCR_MODEL=kimi-k2.5
AI_OCR_BASE_URL=https://api.moonshot.cn/v1
AI_OCR_API_KEY=your-kimi-key

# Audio/Multimodal client (qwen-omni)
AI_AUDIO_MODEL=qwen-omni
AI_AUDIO_BASE_URL=https://dashscope.aliyuncs.com/v1
AI_AUDIO_API_KEY=your-qwen-key
AI_AUDIO_MAX_TOKENS=4096

# Media processing
IMAGE_MAX_DIMENSION=1024
IMAGE_QUALITY=85
VIDEO_MAX_FRAMES=8
VIDEO_FRAME_INTERVAL=2

# Smart routing & cost controls
ENABLE_SMART_ROUTING=true
AI_MAX_COST_PER_REQUEST=0.10
AI_COST_WARNING_THRESHOLD=0.50

# Usage tracking
USAGE_FLUSH_INTERVAL_MS=60000
USAGE_MAX_BUFFER_SIZE=1000
```

## 📊 Usage Tracking & Analytics

### Database Migration

Run the migration to create the usage tracking table:

```bash
psql $DATABASE_URL -f src/db/migrations/001_add_ai_usage_tracking.sql
```

This creates:
- `ai_usage_events` - Detailed log of every AI request
- `ai_usage_daily` - Materialized view for fast aggregates

### Admin API Endpoints

All endpoints require admin authentication:

```
GET  /api/admin/ai-usage/dashboard        # Real-time dashboard
GET  /api/admin/ai-usage/by-tenant        # Usage by tenant
GET  /api/admin/ai-usage/trends           # Usage trends over time
GET  /api/admin/ai-usage/cost-projection  # Cost forecasting
GET  /api/admin/ai-usage/export           # Export data (CSV/JSON)
GET  /api/admin/ai-usage/tenant/:id       # Specific tenant details
GET  /api/admin/ai-usage/realtime         # SSE for live monitoring
```

### Usage Analytics Example

```typescript
import { TokenTracker } from './ai/tracking/token-tracker.js';

const tracker = TokenTracker.getInstance();

// Get tenant usage for last 7 days
const usage = await tracker.getCapabilityBreakdown('tenant-id', 7);
console.log(usage);
// {
//   'text-chat': { requests: 150, tokens: 45000, cost: 0.009 },
//   'vision': { requests: 25, tokens: 28750, cost: 0.143 },
//   'ocr': { requests: 10, tokens: 8500, cost: 0.042 }
// }

// Get cost projection
const projection = await tracker.getCostProjection('tenant-id', 30);
console.log(projection);
// {
//   projectedCost: 5.67,
//   projectedTokens: 125000,
//   trend: 'increasing',
//   recommendations: ['High vision costs - consider optimization']
// }
```

## 🎨 Usage Examples

### Basic Message Processing

```typescript
import { AIOrchestrator } from './ai/orchestrator.js';

const orchestrator = AIOrchestrator.getInstance();

// Process a message with automatic capability detection
const result = await orchestrator.processMessage({
  tenantId: 'tenant-123',
  message: 'What products do you have?',
  conversationHistory: [],
});

console.log(result.response);
console.log(`Cost: $${result.usage.cost}, Tokens: ${result.usage.tokens}`);
```

### Vision/Image Analysis

```typescript
// Analyze an image
const analysis = await orchestrator.analyzeImage(
  'tenant-123',
  imageBuffer,
  'image/jpeg',
  'products' // focus: 'general' | 'products' | 'document' | 'text'
);

console.log(analysis.description);
console.log(analysis.extractedText);
```

### OCR (Text Extraction)

```typescript
// Extract text from receipt/document
const ocrResult = await orchestrator.extractText(
  'tenant-123',
  receiptBuffer,
  'image/jpeg'
);

console.log(ocrResult.fullText);
console.log(ocrResult.blocks); // Structured text blocks
```

### Sticker Understanding

```typescript
// Understand WhatsApp sticker context
const sticker = await orchestrator.understandSticker(
  'tenant-123',
  stickerBuffer,
  'Customer asked about pricing' // conversation context
);

console.log(sticker.meaning);
console.log(sticker.emotion);
console.log(sticker.appropriateResponse);
```

### Quick Text Response (Cheapest)

```typescript
// For simple text queries - uses cheapest model
const quick = await orchestrator.quickResponse(
  'tenant-123',
  'What's your business hours?',
  conversationHistory
);
```

## 🔀 Smart Routing

The system automatically selects the best AI capability based on:
- **Message content** (keywords like "image", "photo", "receipt")
- **Media presence** (images, audio, video)
- **Cost constraints** (stays within budget limits)
- **Performance requirements** (latency thresholds)

### Routing Triggers

```typescript
// Automatically uses VISION capability
"Can you look at this photo?"
"What is this image?"
"Analyze this screenshot"

// Automatically uses OCR capability
"Read this receipt"
"Extract text from document"
"What does this invoice say?"

// Automatically uses TEXT-CHAT (cheapest)
"What are your hours?"
"How much does this cost?"
"Thank you!"
```

## 🖼️ Media Processing

### Supported Formats

**Images:** JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC
**Videos:** MP4, MOV, AVI, MKV, WebM, 3GP
**Audio:** MP3, M4A, OGG, WAV, OPUS, WebM

### WhatsApp-Specific Optimizations

- **Stickers:** Automatically detected and optimized (512px max)
- **Compressed images:** Resized to 1024px max to save tokens
- **Animated images:** Preserved (GIFs, animated WebP)
- **Quality optimization:** JPEG 85% quality, WebP with effort=6

### Image Processing Example

```typescript
import { UniversalMediaDecoder } from './ai/preprocessing/media-decoder.js';

const decoder = UniversalMediaDecoder.getInstance();

// Process for vision API
const processed = await decoder.processForVision(
  imageBuffer,
  'image/jpeg',
  { 
    purpose: 'vision',
    maxDimension: 1024,
    quality: 85,
    enhance: true // Apply brightness/contrast for better analysis
  }
);

console.log(processed.metadata);
// {
//   originalWidth: 3024,
//   originalHeight: 4032,
//   processedWidth: 768,
//   processedHeight: 1024,
//   compressionRatio: 0.15,
//   estimatedTokens: 935
// }
```

## 💰 Cost Tracking

### Cost Calculation

Each capability has defined costs per 1K tokens:

```typescript
// From config.ts
text-chat:     $0.0001 input, $0.0002 output  // Cheap
vision:        $0.005 input, $0.015 output    // Moderate
ocr:           $0.005 input, $0.015 output    // Moderate
audio:         $0.008 input, $0.016 output    // Expensive
multimodal:    $0.01 input, $0.02 output      // Most expensive
```

### Real-Time Monitoring

```typescript
import { TokenTracker } from './ai/tracking/token-tracker.js';

const tracker = TokenTracker.getInstance();

// Listen for real-time usage events
tracker.on('usage', (event) => {
  console.log(`Request: ${event.id}`);
  console.log(`Cost: $${event.tokenUsage.totalCost}`);
  console.log(`Tokens: ${event.tokenUsage.totalTokens}`);
  console.log(`Capability: ${event.capability}`);
});

// Get pending (not yet flushed) metrics
const pending = tracker.getRealtimeMetrics();
console.log(`Pending events: ${pending.bufferedEvents}`);
console.log(`Pending cost: $${pending.estimatedPendingCost}`);
```

## 🔧 Advanced Usage

### Direct Client Usage

```typescript
import { UnifiedAIClient } from './ai/clients/unified-client.js';

// Create a specific capability client
const visionClient = new UnifiedAIClient({
  capability: 'vision',
  tenantId: 'tenant-123',
});

const response = await visionClient.complete({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this image' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
      ]
    }
  ],
  capabilities: ['vision'],
});

console.log(response.content);
console.log(`Used ${response.usage.totalTokens} tokens, cost $${response.usage.totalCost}`);
```

### Custom Tool Creation

```typescript
import { visionTools } from './ai/tools/vision/index.js';

// Use built-in tools directly
const tool = visionTools.identify_products;
const result = await tool.handler({
  imageUrl: processedImage.dataUrl,
  includePricing: true,
  tenantId: 'tenant-123',
});

console.log(result.products);
```

## 📈 Performance Monitoring

### Latency Tracking

Every request tracks:
- **Total latency** (API call time)
- **Token estimation** (before request)
- **Actual token usage** (after request)
- **Success/failure rates**

### Database Schema

```sql
-- View all requests for a tenant
SELECT 
  timestamp,
  capability,
  model,
  total_tokens,
  total_cost,
  latency_ms,
  success
FROM ai_usage_events
WHERE tenant_id = 'tenant-id'
ORDER BY timestamp DESC
LIMIT 100;

-- Daily cost summary
SELECT 
  DATE(timestamp) as date,
  capability,
  COUNT(*) as requests,
  SUM(total_cost) as cost
FROM ai_usage_events
WHERE tenant_id = 'tenant-id'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), capability
ORDER BY date DESC;
```

## 🛡️ Security & Cost Controls

### Automatic Limits

```typescript
// Maximum cost per request (configurable)
AI_MAX_COST_PER_REQUEST=0.10  // $0.10 USD

// Warning threshold
AI_COST_WARNING_THRESHOLD=0.50  // $0.50 USD

// Requests exceeding limits use cheaper fallback
```

### Tenant Isolation

- All usage tracked per-tenant
- No cross-tenant data leakage
- Separate API keys per tenant (optional)

## 🚀 Future Enhancements

### Planned Features

1. **Video Frame Extraction** - Full video understanding
2. **Audio Transcription** - Speech-to-text with speaker ID
3. **Embeddings** - Vector search capabilities
4. **Caching Layer** - Redis-based response caching
5. **A/B Testing** - Compare model performance
6. **Auto-Scaling** - Dynamic capability selection

### Extending Capabilities

Add new capabilities by:
1. Adding config to `capabilityConfigs`
2. Creating client in `UnifiedAIClient`
3. Adding system prompt to `capabilityPrompts`
4. Registering in the router

## 📝 Migration Guide

### From Old AI System

```typescript
// OLD WAY
import { createChatModel } from './ai/llm.js';
const model = createChatModel();

// NEW WAY
import { AIOrchestrator } from './ai/orchestrator.js';
const orchestrator = AIOrchestrator.getInstance();

// The orchestrator automatically:
// 1. Selects best capability
// 2. Processes media
// 3. Tracks usage
// 4. Returns structured response
```

## 🤝 Contributing

When adding new features:
1. Follow the capability-based architecture
2. Add comprehensive tests
3. Update this documentation
4. Ensure usage tracking is included

## 📞 Support

For issues or questions:
1. Check the logs with `LOG_LEVEL=debug`
2. Review usage in `/api/admin/ai-usage/dashboard`
3. Export data for analysis: `/api/admin/ai-usage/export?format=csv`

---

**Built with ❤️ for intelligent, cost-effective AI** 🚀
