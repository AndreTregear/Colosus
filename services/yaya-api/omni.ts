/**
 * vLLM-Omni client for Yaya Platform.
 *
 * NOTE: When @yaya/core is wired as a dependency, the audio conversion
 * utilities (convertOggToWav, convertWavToOpus) should be imported from
 * '@yaya/core/ai' instead of being inlined here.
 */
import { spawn } from 'child_process';
import { tools, executeTool, buildSystemPrompt } from './ai.js';
import * as db from './db.js';

// Environment variables
const OMNI_API_URL = process.env.OMNI_API_URL || 'http://localhost:8091/v1';
const OMNI_API_KEY = process.env.OMNI_API_KEY || 'EMPTY';
const OMNI_MODEL = process.env.OMNI_MODEL || 'Qwen/Qwen3-Omni-30B-A3B-Instruct';
const OMNI_SPEAKER = process.env.OMNI_SPEAKER || 'chelsie';
const OMNI_ENABLED = process.env.OMNI_ENABLED === 'true';

export function isOmniEnabled(): boolean {
  return OMNI_ENABLED;
}

// Audio conversion utilities using ffmpeg
export async function convertOggToWav(oggBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',     // input from stdin
      '-f', 'wav',        // output format
      '-ar', '16000',     // 16kHz sample rate
      '-ac', '1',         // mono channel
      '-acodec', 'pcm_s16le', // PCM 16-bit little endian
      'pipe:1'            // output to stdout
    ]);

    let wavBuffer = Buffer.alloc(0);
    let errorOutput = '';

    ffmpeg.stdout.on('data', (chunk) => {
      wavBuffer = Buffer.concat([wavBuffer, chunk]);
    });

    ffmpeg.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(wavBuffer);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg spawn failed: ${err.message}`));
    });

    // Write OGG data to stdin
    ffmpeg.stdin.write(oggBuffer);
    ffmpeg.stdin.end();
  });
}

export async function convertWavToOpus(wavBase64: string): Promise<Buffer> {
  const wavBuffer = Buffer.from(wavBase64, 'base64');
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',     // input from stdin
      '-f', 'ogg',        // output format
      '-acodec', 'libopus', // Opus codec
      '-ar', '16000',     // 16kHz sample rate
      '-ac', '1',         // mono channel
      '-b:a', '32k',      // bitrate for voice
      'pipe:1'            // output to stdout
    ]);

    let opusBuffer = Buffer.alloc(0);
    let errorOutput = '';

    ffmpeg.stdout.on('data', (chunk) => {
      opusBuffer = Buffer.concat([opusBuffer, chunk]);
    });

    ffmpeg.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(opusBuffer);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg spawn failed: ${err.message}`));
    });

    // Write WAV data to stdin
    ffmpeg.stdin.write(wavBuffer);
    ffmpeg.stdin.end();
  });
}

interface OmniResponse {
  text: string;
  audioBase64?: string;
  audioFormat?: string;
}

export async function chatOmni(
  userId: string, 
  userMessage: string, 
  audioBase64?: string, 
  audioFormat?: string
): Promise<OmniResponse> {
  const recentMessages = db.getAgentMessages(userId, 20, 0).reverse();

  // Build content for the user message
  const content: any[] = [];
  
  if (userMessage.trim()) {
    content.push({ type: 'text', text: userMessage });
  }
  
  if (audioBase64 && audioFormat) {
    content.push({
      type: 'input_audio',
      input_audio: {
        data: audioBase64,
        format: audioFormat
      }
    });
  }

  // If no content, add a default prompt
  if (content.length === 0) {
    content.push({ type: 'text', text: 'Hola' });
  }

  const messages: any[] = [
    { role: 'system', content: buildSystemPrompt(userId) },
    ...recentMessages.map(m => ({
      role: m.role,
      content: m.content
    })),
    { role: 'user', content }
  ];

  let iterations = 0;
  const maxIterations = 5;
  let wantAudio = !!audioBase64; // Only produce audio output for voice input

  while (iterations < maxIterations) {
    // During tool-call loops, use text-only to skip expensive audio generation.
    // Request audio only on what we expect to be the final call.
    const modalities = wantAudio ? ['text', 'audio'] : ['text'];

    const response = await fetch(`${OMNI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OMNI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OMNI_MODEL,
        messages,
        tools,
        modalities,
        speaker: OMNI_SPEAKER,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM-Omni API failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const choice = result.choices?.[0];
    
    if (!choice) {
      throw new Error('No response choice from vLLM-Omni');
    }

    const assistantMessage = choice.message;

    // Check for tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      iterations++;
      console.log(`[Omni] Tool call iteration ${iterations}: ${assistantMessage.tool_calls.map((tc: any) => tc.function.name).join(', ')}`);
      
      // Add assistant message with tool calls to history
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          const toolResult = executeTool(toolCall.function.name, args, userId);
          
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        } catch (error: any) {
          console.error(`[Omni] Tool execution error for ${toolCall.function.name}:`, error.message);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Error executing ${toolCall.function.name}: ${error.message}` }),
          });
        }
      }

      // Next iteration should request audio since it may be the final response
      // (wantAudio stays true if it was set — audio will be generated on the final call)
      continue;
    }

    // No more tool calls, this is the final response
    const textResponse = assistantMessage.content || 'Lo siento, no pude procesar tu consulta.';
    let audioBase64Response: string | undefined;
    let audioFormatResponse: string | undefined;

    // Check for audio response (should be in choices[1] according to docs)
    if (result.choices.length > 1 && result.choices[1].message?.audio) {
      audioBase64Response = result.choices[1].message.audio.data;
      audioFormatResponse = 'wav'; // vLLM-Omni outputs WAV
    }

    return {
      text: textResponse,
      audioBase64: audioBase64Response,
      audioFormat: audioFormatResponse,
    };
  }

  // If we hit max iterations, return what we have
  throw new Error('Maximum tool call iterations reached');
}