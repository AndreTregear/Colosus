import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Helper: require env var in production, allow fallback in dev ──

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${key}`);
}

// ── Paths ──

export const DATA_DIR = path.resolve(__dirname, '..', 'data');
export const AUTH_DIR = path.join(DATA_DIR, 'auth');
export const DB_PATH = path.join(DATA_DIR, 'autobot.db');
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');

// ── Server ──

export const WEB_PORT = Number(process.env.PORT) || 3000;

// ── Database ──

export const DATABASE_URL = requireEnv('DATABASE_URL');

// ── Redis ──

export const REDIS_URL = requireEnv('REDIS_URL');

// ── Auth ──

export const BETTER_AUTH_SECRET = (() => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required. Set it in .env. Generate one with: openssl rand -base64 32');
  }
  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }
  return secret;
})();

export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || `http://localhost:${WEB_PORT}`;

// ── OpenClaw ──

export const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:3100/api/v1';
export const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

// ── AI ──

export const AI_API_KEY = requireEnv('AI_API_KEY');
export const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
export const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat';
export const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS) || 1024;
export const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE) || 0.7;
export const AI_AGENT_MAX_ITERATIONS = Number(process.env.AI_AGENT_MAX_ITERATIONS) || 10;
export const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 60_000;

// ── Vision / Whisper ──

export const VISION_BASE_URL = process.env.VISION_BASE_URL || AI_BASE_URL;
export const VISION_API_KEY = process.env.VISION_API_KEY || AI_API_KEY;
export const VISION_MODEL = process.env.VISION_MODEL || AI_MODEL;
export const WHISPER_BASE_URL = process.env.WHISPER_BASE_URL || 'https://api.openai.com/v1';
export const WHISPER_API_KEY = process.env.WHISPER_API_KEY || AI_API_KEY;
export const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-1';

// ── Queue ──

export const QUEUE_CONCURRENCY = Number(process.env.QUEUE_CONCURRENCY) || 10;
export const QUEUE_MAX_RETRIES = Number(process.env.QUEUE_MAX_RETRIES) || 3;
export const QUEUE_RETRY_DELAY_MS = Number(process.env.QUEUE_RETRY_DELAY_MS) || 5000;

// ── Business defaults (overridable per-tenant via settings) ──

export const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Mi Negocio';
export const YAPE_NUMBER = process.env.YAPE_NUMBER || '';
export const YAPE_NAME = process.env.YAPE_NAME || '';
export const BUSINESS_CURRENCY = process.env.BUSINESS_CURRENCY || 'PEN';

// ── Uploads ──

export const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB) || 10;
export const MEDIA_MAX_VIDEO_SIZE_MB = Number(process.env.MEDIA_MAX_VIDEO_SIZE_MB) || 50;

// ── Object Storage (S3 / MinIO) ──

export const S3_ENDPOINT = process.env.S3_ENDPOINT || 'localhost';
export const S3_PORT = Number(process.env.S3_PORT) || 9000;
export const S3_ACCESS_KEY = requireEnv('S3_ACCESS_KEY');
export const S3_SECRET_KEY = requireEnv('S3_SECRET_KEY');
export const S3_USE_SSL = process.env.S3_USE_SSL === 'true';
export const S3_BUCKET_RAW = process.env.S3_BUCKET_RAW || 'media-raw';
export const S3_BUCKET_PROCESSED = process.env.S3_BUCKET_PROCESSED || 'media-processed';
export const S3_BUCKET_EXPORTS = process.env.S3_BUCKET_EXPORTS || 'warehouse-exports';
export const S3_PRESIGN_TTL = Number(process.env.S3_PRESIGN_TTL) || 300; // 5 minutes

// ── Media Processing ──

export const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
export const FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe';
export const MEDIA_QUEUE_CONCURRENCY = Number(process.env.MEDIA_QUEUE_CONCURRENCY) || 3;

// ── Google Calendar (stub — not configured) ──

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${BETTER_AUTH_URL}/api/v1/calendar/callback`;

// ── AI Capability-Based Configuration ────────────────────────────────────

// Low-effort text client (fast, cheap)
export const AI_TEXT_MODEL = process.env.AI_TEXT_MODEL || 'deepseek-chat';
export const AI_TEXT_BASE_URL = process.env.AI_TEXT_BASE_URL || 'https://api.deepseek.com/v1';
export const AI_TEXT_API_KEY = process.env.AI_TEXT_API_KEY || AI_API_KEY;
export const AI_TEXT_MAX_TOKENS = Number(process.env.AI_TEXT_MAX_TOKENS) || 1024;
export const AI_TEXT_TEMPERATURE = Number(process.env.AI_TEXT_TEMPERATURE) || 0.7;

// Vision client (kimi-k2.5)
export const AI_VISION_MODEL = process.env.AI_VISION_MODEL || 'kimi-k2.5';
export const AI_VISION_BASE_URL = process.env.AI_VISION_BASE_URL || 'https://api.moonshot.cn/v1';
export const AI_VISION_API_KEY = process.env.AI_VISION_API_KEY || '';
export const AI_VISION_MAX_TOKENS = Number(process.env.AI_VISION_MAX_TOKENS) || 4096;
export const AI_VISION_TEMPERATURE = Number(process.env.AI_VISION_TEMPERATURE) || 0.7;

// OCR client (can be same as vision)
export const AI_OCR_MODEL = process.env.AI_OCR_MODEL || AI_VISION_MODEL;
export const AI_OCR_BASE_URL = process.env.AI_OCR_BASE_URL || AI_VISION_BASE_URL;
export const AI_OCR_API_KEY = process.env.AI_OCR_API_KEY || AI_VISION_API_KEY;
export const AI_OCR_MAX_TOKENS = Number(process.env.AI_OCR_MAX_TOKENS) || 4096;

// Audio/Multimodal client (qwen-omni)
export const AI_AUDIO_MODEL = process.env.AI_AUDIO_MODEL || 'qwen-omni';
export const AI_AUDIO_BASE_URL = process.env.AI_AUDIO_BASE_URL || 'https://dashscope.aliyuncs.com/v1';
export const AI_AUDIO_API_KEY = process.env.AI_AUDIO_API_KEY || '';
export const AI_AUDIO_MAX_TOKENS = Number(process.env.AI_AUDIO_MAX_TOKENS) || 4096;
export const AI_AUDIO_TEMPERATURE = Number(process.env.AI_AUDIO_TEMPERATURE) || 0.7;

export const AI_MULTIMODAL_MODEL = process.env.AI_MULTIMODAL_MODEL || AI_AUDIO_MODEL;
export const AI_MULTIMODAL_BASE_URL = process.env.AI_MULTIMODAL_BASE_URL || AI_AUDIO_BASE_URL;
export const AI_MULTIMODAL_API_KEY = process.env.AI_MULTIMODAL_API_KEY || AI_AUDIO_API_KEY;
export const AI_MULTIMODAL_MAX_TOKENS = Number(process.env.AI_MULTIMODAL_MAX_TOKENS) || 4096;

// Embeddings client
export const AI_EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';
export const AI_EMBEDDING_BASE_URL = process.env.AI_EMBEDDING_BASE_URL || 'https://api.openai.com/v1';
export const AI_EMBEDDING_API_KEY = process.env.AI_EMBEDDING_API_KEY || '';

// ── AI Media Processing Configuration ────────────────────────────────────

export const IMAGE_MAX_DIMENSION = Number(process.env.IMAGE_MAX_DIMENSION) || 1024;
export const IMAGE_QUALITY = Number(process.env.IMAGE_QUALITY) || 85;
export const VIDEO_MAX_FRAMES = Number(process.env.VIDEO_MAX_FRAMES) || 8;
export const VIDEO_FRAME_INTERVAL = Number(process.env.VIDEO_FRAME_INTERVAL) || 2;

// ── AI Smart Routing Configuration ───────────────────────────────────────

export const ENABLE_SMART_ROUTING = process.env.ENABLE_SMART_ROUTING !== 'false'; // default true
export const AI_MAX_COST_PER_REQUEST = Number(process.env.AI_MAX_COST_PER_REQUEST) || 0.10; // $0.10
export const AI_COST_WARNING_THRESHOLD = Number(process.env.AI_COST_WARNING_THRESHOLD) || 0.50; // $0.50

// ── AI Usage Tracking Configuration ─────────────────────────────────────

export const USAGE_FLUSH_INTERVAL_MS = Number(process.env.USAGE_FLUSH_INTERVAL_MS) || 60000; // 1 min
export const USAGE_MAX_BUFFER_SIZE = Number(process.env.USAGE_MAX_BUFFER_SIZE) || 1000;

// ── OSS Service Integrations ──────────────────────────────────────────

// Lago (billing / subscriptions)
export const LAGO_API_URL = process.env.LAGO_API_URL || 'http://lago-api:3000';
export const LAGO_API_KEY = process.env.LAGO_API_KEY || '';

// Cal.com (appointments / scheduling)
export const CALCOM_API_URL = process.env.CALCOM_API_URL || 'http://calcom:3000';
export const CALCOM_API_KEY = process.env.CALCOM_API_KEY || '';

// Metabase (BI dashboards / saved questions)
export const METABASE_API_URL = process.env.METABASE_API_URL || 'http://metabase:3000';
export const METABASE_API_KEY = process.env.METABASE_API_KEY || '';

// InvoiceShelf (invoicing)
export const INVOICESHELF_API_URL = process.env.INVOICESHELF_API_URL || 'http://invoiceshelf:9000';
export const INVOICESHELF_API_KEY = process.env.INVOICESHELF_API_KEY || '';

// ── LangFuse Observability ──────────────────────────────────────────────

export const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY || '';
export const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY || '';
export const LANGFUSE_HOST = process.env.LANGFUSE_HOST || 'http://localhost:3001';
