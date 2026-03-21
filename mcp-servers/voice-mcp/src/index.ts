#!/usr/bin/env node
/**
 * Voice Pipeline MCP Server
 * Combines Whisper (STT) + Kokoro (TTS) for full voice loop.
 *
 * Tools:
 *  - transcribe_audio: Speech-to-text via Whisper
 *  - synthesize_speech: Text-to-speech via Kokoro TTS
 *  - voice_reply: Complete pipeline — text → TTS → OGG Opus (WhatsApp-ready)
 *  - detect_language: Detect audio language via Whisper
 *  - get_available_voices: List available TTS voices
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { writeFile, readFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

// ── Configuration ────────────────────────────────────

const WHISPER_URL = process.env.WHISPER_URL || "http://localhost:9100";
const TTS_URL = process.env.TTS_URL || "http://localhost:9200";
const TTS_API_KEY = process.env.TTS_API_KEY || "megustalaia";
const VOICE_OUTPUT_DIR = process.env.VOICE_OUTPUT_DIR || "/tmp/voice-output";
const DEFAULT_VOICE = process.env.DEFAULT_VOICE || "af_heart";
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || "es";
const REQUEST_TIMEOUT_MS = 30_000;

// ── Available Voices ─────────────────────────────────

interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: string;
  style: string;
}

const VOICES: VoiceInfo[] = [
  { id: "af_heart", name: "Heart", language: "en-us", gender: "female", style: "warm, friendly" },
  { id: "af_bella", name: "Bella", language: "en-us", gender: "female", style: "soft, gentle" },
  { id: "af_nicole", name: "Nicole", language: "en-us", gender: "female", style: "clear, professional" },
  { id: "af_sarah", name: "Sarah", language: "en-us", gender: "female", style: "expressive, bright" },
  { id: "af_sky", name: "Sky", language: "en-us", gender: "female", style: "calm, natural" },
  { id: "am_adam", name: "Adam", language: "en-us", gender: "male", style: "deep, confident" },
  { id: "am_michael", name: "Michael", language: "en-us", gender: "male", style: "neutral, clear" },
  { id: "bf_emma", name: "Emma", language: "en-gb", gender: "female", style: "British, articulate" },
  { id: "bm_george", name: "George", language: "en-gb", gender: "male", style: "British, warm" },
  { id: "ef_dora", name: "Dora", language: "es", gender: "female", style: "Spanish, warm" },
  { id: "em_alex", name: "Alex", language: "es", gender: "male", style: "Spanish, clear" },
  { id: "ff_siwis", name: "Siwis", language: "fr", gender: "female", style: "French, elegant" },
  { id: "hf_alpha", name: "Alpha", language: "hi", gender: "female", style: "Hindi, expressive" },
  { id: "hm_omega", name: "Omega", language: "hi", gender: "male", style: "Hindi, deep" },
  { id: "jf_alpha", name: "Alpha JP", language: "ja", gender: "female", style: "Japanese, soft" },
  { id: "jm_omega", name: "Omega JP", language: "ja", gender: "male", style: "Japanese, clear" },
  { id: "zf_xiaobei", name: "Xiaobei", language: "zh", gender: "female", style: "Chinese, gentle" },
  { id: "zm_yunjian", name: "Yunjian", language: "zh", gender: "male", style: "Chinese, authoritative" },
];

// ── Helpers ──────────────────────────────────────────

async function ensureOutputDir(): Promise<void> {
  try {
    await access(VOICE_OUTPUT_DIR);
  } catch {
    await mkdir(VOICE_OUTPUT_DIR, { recursive: true });
  }
}

async function httpRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

/**
 * Download a file from a URL and return the local path.
 */
async function downloadFile(url: string): Promise<string> {
  const res = await httpRequest(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop() || "ogg";
  const filePath = join(VOICE_OUTPUT_DIR, `input-${randomUUID()}.${ext}`);
  await ensureOutputDir();
  await writeFile(filePath, buffer);
  return filePath;
}

/**
 * Convert audio to OGG Opus format (WhatsApp voice note format).
 * Uses ffmpeg with libopus codec, mono channel, 48kHz sample rate.
 */
async function convertToOggOpus(inputPath: string): Promise<string> {
  const outputPath = join(
    VOICE_OUTPUT_DIR,
    `voice-${randomUUID()}.ogg`
  );

  await execFileAsync("ffmpeg", [
    "-i", inputPath,
    "-c:a", "libopus",
    "-b:a", "64k",
    "-ar", "48000",
    "-ac", "1",
    "-application", "voip",
    "-y",
    outputPath,
  ], { timeout: REQUEST_TIMEOUT_MS });

  return outputPath;
}

// ── Whisper (STT) Client ─────────────────────────────

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

async function transcribeAudio(
  audioPath: string,
  language?: string
): Promise<TranscriptionResult> {
  const audioData = await readFile(audioPath);
  const formData = new FormData();
  formData.append("file", new Blob([audioData]), "audio.ogg");
  if (language) {
    formData.append("language", language);
  }

  const res = await httpRequest(`${WHISPER_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper transcription failed (${res.status}): ${text}`);
  }

  return await res.json() as TranscriptionResult;
}

async function detectLanguage(
  audioPath: string
): Promise<{ language: string; confidence: number }> {
  const audioData = await readFile(audioPath);
  const formData = new FormData();
  formData.append("file", new Blob([audioData]), "audio.ogg");
  formData.append("detect_language", "true");

  const res = await httpRequest(`${WHISPER_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper language detection failed (${res.status}): ${text}`);
  }

  const data = await res.json() as any;
  return {
    language: data.language || "unknown",
    confidence: data.language_probability || 0,
  };
}

// ── Kokoro TTS Client ────────────────────────────────

/**
 * Call Kokoro TTS API (OpenAI-compatible: POST /api/v1/audio/speech).
 * Returns the raw audio buffer and the response format.
 */
async function synthesizeSpeech(
  text: string,
  voice: string = DEFAULT_VOICE,
  speed: number = 1.0,
  responseFormat: string = "mp3"
): Promise<{ buffer: Buffer; format: string }> {
  const res = await httpRequest(`${TTS_URL}/api/v1/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TTS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "kokoro",
      input: text,
      voice,
      speed,
      response_format: responseFormat,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kokoro TTS failed (${res.status}): ${text}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, format: responseFormat };
}

// ── Tool Definitions ─────────────────────────────────

const TOOLS = [
  {
    name: "transcribe_audio",
    description:
      "Transcribe an audio file to text using Whisper. Accepts a URL or local file path. Returns the transcribed text in the detected or specified language.",
    inputSchema: {
      type: "object" as const,
      properties: {
        audio_url: {
          type: "string",
          description: "URL of the audio file to transcribe (e.g., from WhatsApp voice note)",
        },
        audio_path: {
          type: "string",
          description: "Local file path of the audio file to transcribe",
        },
        language: {
          type: "string",
          description: "Language code for transcription (default: 'es'). Use 'auto' for automatic detection.",
        },
      },
      required: [],
    },
  },
  {
    name: "synthesize_speech",
    description:
      "Convert text to speech audio using Kokoro TTS. Returns the path to the generated audio file. Supports multiple voices and languages.",
    inputSchema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "Text to convert to speech",
        },
        voice: {
          type: "string",
          description: `Voice ID (default: '${DEFAULT_VOICE}'). Use get_available_voices to see options.`,
        },
        language: {
          type: "string",
          description: "Language code (default: 'es'). Helps select appropriate voice if none specified.",
        },
        speed: {
          type: "number",
          description: "Speech speed multiplier (default: 1.0). Range: 0.5 to 2.0.",
        },
        format: {
          type: "string",
          enum: ["mp3", "wav", "opus", "flac"],
          description: "Output audio format (default: 'mp3')",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "voice_reply",
    description:
      "Generate a WhatsApp-ready voice note from text. This is the primary tool for voice responses — it synthesizes speech and converts to OGG Opus format (WhatsApp voice note). Returns the file path ready to send via WhatsApp MCP.",
    inputSchema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "The agent's response text to convert into a voice note",
        },
        voice: {
          type: "string",
          description: `Voice ID (default: '${DEFAULT_VOICE}'). Use get_available_voices for options.`,
        },
        speed: {
          type: "number",
          description: "Speech speed multiplier (default: 1.0)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "detect_language",
    description:
      "Detect the language of an audio file using Whisper. Useful for multilingual markets (e.g., Cusco with Spanish/English/Quechua-speaking tourists). Returns the detected language and confidence score.",
    inputSchema: {
      type: "object" as const,
      properties: {
        audio_url: {
          type: "string",
          description: "URL of the audio file",
        },
        audio_path: {
          type: "string",
          description: "Local file path of the audio file",
        },
      },
      required: [],
    },
  },
  {
    name: "get_available_voices",
    description:
      "List all available TTS voices with their language, gender, and style information. Use this to help choose the right voice for the context.",
    inputSchema: {
      type: "object" as const,
      properties: {
        language: {
          type: "string",
          description: "Filter voices by language code (e.g., 'es', 'en-us', 'fr')",
        },
        gender: {
          type: "string",
          enum: ["male", "female"],
          description: "Filter voices by gender",
        },
      },
      required: [],
    },
  },
];

// ── Tool Handlers ────────────────────────────────────

async function resolveAudioPath(
  audioUrl?: string,
  audioPath?: string
): Promise<string> {
  if (audioPath) {
    return audioPath;
  }
  if (audioUrl) {
    return await downloadFile(audioUrl);
  }
  throw new Error(
    "Either audio_url or audio_path must be provided."
  );
}

async function handleTool(
  name: string,
  args: Record<string, any>
): Promise<string> {
  switch (name) {
    case "transcribe_audio": {
      const audioPath = await resolveAudioPath(args.audio_url, args.audio_path);
      const language = args.language === "auto" ? undefined : (args.language || DEFAULT_LANGUAGE);

      const result = await transcribeAudio(audioPath, language);

      return JSON.stringify({
        text: result.text,
        language: result.language || language,
        duration_seconds: result.duration,
        segments: result.segments,
      }, null, 2);
    }

    case "synthesize_speech": {
      await ensureOutputDir();

      const text = args.text;
      if (!text || text.trim().length === 0) {
        throw new Error("text cannot be empty.");
      }

      const voice = args.voice || DEFAULT_VOICE;
      const speed = args.speed || 1.0;
      const format = args.format || "mp3";

      const { buffer } = await synthesizeSpeech(text, voice, speed, format);

      const outputPath = join(
        VOICE_OUTPUT_DIR,
        `tts-${randomUUID()}.${format}`
      );
      await writeFile(outputPath, buffer);

      return JSON.stringify({
        file_path: outputPath,
        format,
        voice,
        speed,
        text_length: text.length,
        file_size_bytes: buffer.length,
      }, null, 2);
    }

    case "voice_reply": {
      await ensureOutputDir();

      const text = args.text;
      if (!text || text.trim().length === 0) {
        throw new Error("text cannot be empty.");
      }

      const voice = args.voice || DEFAULT_VOICE;
      const speed = args.speed || 1.0;

      // Step 1: Synthesize speech via Kokoro TTS
      const { buffer } = await synthesizeSpeech(text, voice, speed, "mp3");

      // Step 2: Save intermediate MP3
      const mp3Path = join(VOICE_OUTPUT_DIR, `tts-${randomUUID()}.mp3`);
      await writeFile(mp3Path, buffer);

      // Step 3: Convert to OGG Opus (WhatsApp voice note format)
      const oggPath = await convertToOggOpus(mp3Path);

      // Read the OGG file to get its size
      const oggBuffer = await readFile(oggPath);

      return JSON.stringify({
        file_path: oggPath,
        format: "ogg/opus",
        voice,
        speed,
        text_length: text.length,
        file_size_bytes: oggBuffer.length,
        whatsapp_ready: true,
        usage_hint: "Pass file_path to whatsapp-mcp send_media with media_type 'audio'",
      }, null, 2);
    }

    case "detect_language": {
      const audioPath = await resolveAudioPath(args.audio_url, args.audio_path);
      const result = await detectLanguage(audioPath);

      return JSON.stringify({
        language: result.language,
        confidence: result.confidence,
        language_name: getLanguageName(result.language),
      }, null, 2);
    }

    case "get_available_voices": {
      let filtered = VOICES;

      if (args.language) {
        const lang = args.language.toLowerCase();
        filtered = filtered.filter(
          (v) => v.language === lang || v.language.startsWith(lang)
        );
      }

      if (args.gender) {
        filtered = filtered.filter(
          (v) => v.gender === args.gender.toLowerCase()
        );
      }

      return JSON.stringify({
        voices: filtered,
        total: filtered.length,
        default_voice: DEFAULT_VOICE,
        default_language: DEFAULT_LANGUAGE,
      }, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Language Name Map ────────────────────────────────

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    es: "Spanish",
    en: "English",
    fr: "French",
    pt: "Portuguese",
    de: "German",
    it: "Italian",
    ja: "Japanese",
    zh: "Chinese",
    ko: "Korean",
    hi: "Hindi",
    qu: "Quechua",
    ay: "Aymara",
  };
  return languages[code] || code;
}

// ── MCP Server Setup ─────────────────────────────────

const server = new Server(
  { name: "voice-mcp", version: "0.1.0" },
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
  await ensureOutputDir();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `Voice MCP server running on stdio (whisper: ${WHISPER_URL}, tts: ${TTS_URL}, output: ${VOICE_OUTPUT_DIR})`
  );
}

main().catch(console.error);
