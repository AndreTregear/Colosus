import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  BufferJSON,
  initAuthCreds,
  proto,
  type WASocket,
  type AuthenticationState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import * as db from './db.js';
import { chat } from './ai.js';
import { chatOmni, isOmniEnabled, convertOggToWav, convertWavToOpus } from './omni.js';
import { handleOnboardingMessage, isOnboarding } from './onboarding.js';

// ── SSE broadcast ────────────────────────────────────────────

export const sseBus = new EventEmitter();
sseBus.setMaxListeners(100);

export function broadcast(event: string, data: any) {
  sseBus.emit('sse', { event, data });
}

// ── SQLite auth state (adapted from autobot pg-auth-state) ──

function useSqliteAuthState(userId: string) {
  const writeData = (data: unknown): string => {
    return JSON.stringify(data, BufferJSON.replacer);
  };

  const readData = (data: string): unknown => {
    return JSON.parse(data, BufferJSON.reviver);
  };

  // Load or initialize creds
  const credsRow = db.getWaAuthCreds(userId);
  let creds: any;

  if (credsRow?.creds) {
    try {
      creds = JSON.parse(credsRow.creds, BufferJSON.reviver);
    } catch {
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
    db.upsertWaAuthCreds(userId, writeData(creds));
  }

  const saveCreds = () => {
    db.upsertWaAuthCreds(userId, writeData(creds));
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type: string, ids: string[]) => {
        const data: Record<string, any> = {};
        if (ids.length === 0) return data;

        const rows = db.getWaAuthKeys(userId, type, ids);
        for (const row of rows) {
          try {
            let value: any = JSON.parse(row.key_data, BufferJSON.reviver);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[row.key_id] = value;
          } catch {
            // skip corrupt keys
          }
        }
        return data;
      },
      set: async (data: Record<string, Record<string, unknown>>) => {
        for (const [type, entries] of Object.entries(data)) {
          for (const [id, value] of Object.entries(entries)) {
            if (value) {
              db.upsertWaAuthKey(userId, type, id, writeData(value));
            } else {
              db.deleteWaAuthKey(userId, type, id);
            }
          }
        }
      },
    },
  };

  return { state, saveCreds };
}

// ── WhatsApp Manager ─────────────────────────────────────────

export interface WAStatus {
  status: 'disconnected' | 'connecting' | 'connected';
  phoneNumber: string | null;
}

class WhatsAppManager {
  private sock: WASocket | null = null;
  private qrDataUrl: string | null = null;
  private connectionStatus: WAStatus = { status: 'disconnected', phoneNumber: null };
  private userId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  getStatus(): WAStatus {
    return { ...this.connectionStatus };
  }

  getQR(): string | null {
    return this.qrDataUrl;
  }

  getUserId(): string | null {
    return this.userId;
  }

  async connect(userId: string): Promise<void> {
    if (this.sock) {
      console.log('[WA] Already connected or connecting');
      return;
    }

    this.userId = userId;
    this.connectionStatus = { status: 'connecting', phoneNumber: null };
    this.qrDataUrl = null;
    broadcast('wa:status', this.connectionStatus);

    const { state, saveCreds } = useSqliteAuthState(userId);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }) as any,
      browser: ['Yaya', 'Chrome', '1.0.0'],
    });

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrDataUrl = await QRCode.toDataURL(qr, { width: 300 });
        broadcast('wa:qr', { qr: this.qrDataUrl });
        console.log('[WA] QR code generated — scan with WhatsApp');
      }

      if (connection === 'open') {
        this.qrDataUrl = null;
        const phone = this.sock?.user?.id?.split('@')[0]?.split(':')[0] ?? null;
        this.connectionStatus = { status: 'connected', phoneNumber: phone };
        broadcast('wa:status', this.connectionStatus);
        console.log(`[WA] Connected as ${phone}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode ?? 0;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        this.sock = null;
        this.qrDataUrl = null;
        this.connectionStatus = { status: 'disconnected', phoneNumber: null };
        broadcast('wa:status', this.connectionStatus);

        if (loggedOut) {
          // Clear auth state so user can re-scan
          db.clearWaAuth(userId);
          console.log('[WA] Logged out — auth cleared');
        } else if (this.userId) {
          // Reconnect after a delay
          console.log(`[WA] Disconnected (code ${statusCode}), reconnecting in 5s...`);
          this.reconnectTimer = setTimeout(() => {
            if (this.userId && !this.sock) {
              this.connect(this.userId).catch(err => console.error('[WA] Reconnect failed:', err.message));
            }
          }, 5000);
        }
      }
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const raw of messages) {
        await this.handleMessage(raw, userId);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
    }
    this.qrDataUrl = null;
    this.connectionStatus = { status: 'disconnected', phoneNumber: null };
    this.userId = null;
    broadcast('wa:status', this.connectionStatus);
    console.log('[WA] Disconnected');
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.sock) throw new Error('WhatsApp not connected');
    await this.sock.sendMessage(jid, { text });
  }

  async sendVoiceNote(jid: string, text: string): Promise<void> {
    if (!this.sock) throw new Error('WhatsApp not connected');
    const ttsUrl = process.env.TTS_URL || 'http://localhost:9400';
    
    try {
      console.log(`[WA] Generating voice note (${text.length} chars)...`);
      
      // Call Kokoro TTS API (OpenAI-compatible)
      const resp = await fetch(`${ttsUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'kokoro',
          input: text.substring(0, 1000), // limit to 1000 chars for voice
          voice: 'af_heart', // warm female voice, good for Spanish
          response_format: 'opus',
          speed: 1.0,
        }),
      });

      if (!resp.ok) {
        console.error(`[WA] TTS failed: ${resp.status} ${resp.statusText}`);
        // Fallback to text
        await this.sock.sendMessage(jid, { text });
        return;
      }

      const audioBuffer = Buffer.from(await resp.arrayBuffer());
      console.log(`[WA] Voice note generated (${audioBuffer.length} bytes), sending...`);
      
      await this.sock.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true, // push-to-talk = true makes it a voice note (not audio file)
      });
      
      console.log('[WA] Voice note sent successfully');
    } catch (err: any) {
      console.error('[WA] Voice note error:', err.message);
      // Fallback to text message
      await this.sock.sendMessage(jid, { text });
    }
  }

  private async handleMessage(raw: proto.IWebMessageInfo, userId: string): Promise<void> {
    if (!raw.key || !raw.key.remoteJid || !raw.message) return;

    const remoteJid = raw.key.remoteJid;
    if (remoteJid === 'status@broadcast') return;

    const selfPhone = this.sock?.user?.id?.split('@')[0]?.split(':')[0] ?? '';
    const remoteLocal = remoteJid.split('@')[0];
    const isSelfChat = remoteLocal === selfPhone;
    const msgType = Object.keys(raw.message).filter(k => k !== 'messageContextInfo').join(',');
    
    console.log(`[WA] Message received: from=${remoteLocal} fromMe=${raw.key.fromMe} selfChat=${isSelfChat} type=${msgType}`);

    // Skip bot's own outgoing messages (but NOT self-chat)
    if (raw.key.fromMe && !isSelfChat) {
      console.log('[WA] Skipping own outgoing message');
      return;
    }

    // Extract text — handle voice messages via Whisper transcription
    let text = raw.message.conversation
      || raw.message.extendedTextMessage?.text
      || raw.message.imageMessage?.caption
      || null;

    // Handle audio/voice messages
    const audioMsg = raw.message.audioMessage;
    let audioBuffer: Buffer | null = null;
    if (audioMsg && !text) {
      try {
        console.log('[WA] Voice message received...');
        const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
        audioBuffer = await downloadMediaMessage(raw, 'buffer', {}) as Buffer;
        
        if (isOmniEnabled()) {
          console.log('[WA] Using Omni for audio processing');
          // For omni mode, we'll process the audio directly in the AI response section
          // Set a placeholder text to indicate this is a voice message
          text = ''; // Empty text, but we have audioBuffer for omni processing
        } else {
          console.log('[WA] Using Whisper transcription...');
          // Send to Whisper API (OpenAI-compatible endpoint or local)
          const whisperUrl = process.env.WHISPER_URL || process.env.AI_API_URL || 'https://ai.yaya.sh/v1';
          const whisperKey = process.env.WHISPER_API_KEY || process.env.AI_API_KEY || '';
          
          const FormData = (await import('node:buffer')).Buffer;
          const boundary = '----FormBoundary' + randomUUID().replace(/-/g, '');
          
          // Build multipart form data manually
          const parts: Buffer[] = [];
          parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="voice.ogg"\r\nContent-Type: audio/ogg\r\n\r\n`));
          parts.push(audioBuffer);
          parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`));
          parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nes\r\n`));
          parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
          const body = Buffer.concat(parts);

          const resp = await fetch(`${whisperUrl}/audio/transcriptions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whisperKey}`,
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            body,
          });

          if (resp.ok) {
            const result = await resp.json() as { text?: string };
            text = result.text || null;
            if (text) {
              console.log(`[WA] Transcribed voice: "${text.substring(0, 80)}..."`);
            }
          } else {
            console.error(`[WA] Whisper transcription failed: ${resp.status} ${resp.statusText}`);
            // Fallback: tell user we can't process audio right now
            text = null;
          }
        }
      } catch (err: any) {
        console.error('[WA] Voice processing error:', err.message);
        text = null;
      }
    }

    if (!text && !audioBuffer) {
      // If still no text and no audio buffer (unsupported media or transcription failed), send helpful reply
      if (audioMsg) {
        const contactName = raw.pushName || remoteJid.split('@')[0];
        if (!raw.key.fromMe) {
          await this.sendMessage(remoteJid, '🎤 Recibí tu mensaje de voz pero no pude procesarlo en este momento. ¿Podrías escribirme lo que necesitas? 🙏');
        }
      }
      return;
    }

    const contactName = raw.pushName || remoteLocal;
    const fromMe = raw.key.fromMe ?? false;
    const isVoiceMessage = !!audioMsg; // Track if original was voice

    // Store incoming message
    const msgId = `wa_${randomUUID().slice(0, 12)}`;
    db.insertWaMessage(msgId, userId, remoteJid, contactName, fromMe, text || '', isVoiceMessage ? 'voice' : 'text');

    // Broadcast to web UI
    broadcast('wa:message', {
      id: msgId,
      remote_jid: remoteJid,
      contact_name: contactName,
      from_me: fromMe,
      content: text || '',
      created_at: new Date().toISOString(),
    });

    // In self-chat, bot's own replies also have fromMe=true — prevent infinite loop
    // Check if this message was sent by us (bot) by checking recent sent messages
    if (fromMe && isSelfChat) {
      // Only process if it's a genuine user message, not our bot reply
      // Bot replies are stored in wa_messages — check if we just sent this
      const recentBotMsg = db.getDb().prepare(
        "SELECT id FROM wa_messages WHERE content = ? AND from_me = 1 AND created_at > datetime('now', '-10 seconds') LIMIT 1"
      ).get(text);
      if (recentBotMsg) {
        console.log('[WA] Skipping self-chat bot echo');
        return;
      }
    }

    // Check if onboarding is needed
    if (isOnboarding(userId)) {
      const response = await handleOnboardingMessage(userId, text || '', contactName);
      if (response) {
        await this.sendMessage(remoteJid, response);
        const respId = `wa_${randomUUID().slice(0, 12)}`;
        db.insertWaMessage(respId, userId, remoteJid, 'Yaya', true, response, 'text');
        broadcast('wa:message', {
          id: respId,
          remote_jid: remoteJid,
          contact_name: 'Yaya',
          from_me: true,
          content: response,
          created_at: new Date().toISOString(),
        });
      }
      return;
    }

    // Process with AI agent
    try {
      // Show composing status
      if (this.sock) {
        await this.sock.presenceSubscribe(remoteJid);
        await this.sock.sendPresenceUpdate('composing', remoteJid);
      }

      let response: { role: string; content: string; metadata?: any };
      let audioResponseBuffer: Buffer | null = null;

      if (isOmniEnabled() && (audioBuffer || text)) {
        // Use Omni for audio-native conversation
        let audioBase64: string | undefined;
        let audioFormat: string | undefined;
        
        if (audioBuffer) {
          // Convert OGG to base64 for omni (librosa supports OGG directly)
          audioBase64 = audioBuffer.toString('base64');
          audioFormat = 'ogg';
        }
        
        const omniResponse = await chatOmni(userId, text || '', audioBase64, audioFormat);
        response = { role: 'assistant', content: omniResponse.text };
        
        // Convert audio response if available
        if (omniResponse.audioBase64 && omniResponse.audioFormat === 'wav') {
          try {
            audioResponseBuffer = await convertWavToOpus(omniResponse.audioBase64);
          } catch (audioErr: any) {
            console.error('[WA] Audio conversion error:', audioErr.message);
            // Continue with text response if audio fails
          }
        }
      } else {
        // Use traditional text-based AI
        response = await chat(userId, text || '');
      }

      const aiText = response.content;

      // Send AI response via WhatsApp
      if (isVoiceMessage && audioResponseBuffer) {
        // Send audio response for voice messages when available
        console.log(`[WA] Sending voice response (${audioResponseBuffer.length} bytes)`);
        await this.sock!.sendMessage(remoteJid, {
          audio: audioResponseBuffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true,
        });
      } else if (isVoiceMessage && !audioResponseBuffer && !isOmniEnabled()) {
        // Fallback to Kokoro TTS for voice messages when not using omni
        await this.sendVoiceNote(remoteJid, aiText);
      } else {
        // Send text response
        await this.sendMessage(remoteJid, aiText);
      }

      // Store AI response
      const respId = `wa_${randomUUID().slice(0, 12)}`;
      db.insertWaMessage(respId, userId, remoteJid, 'Yaya', true, aiText, 'text', aiText);

      // Broadcast to web UI
      broadcast('wa:message', {
        id: respId,
        remote_jid: remoteJid,
        contact_name: 'Yaya',
        from_me: true,
        content: aiText,
        created_at: new Date().toISOString(),
      });

      // Clear composing
      if (this.sock) {
        await this.sock.sendPresenceUpdate('paused', remoteJid);
      }
    } catch (err: any) {
      console.error('[WA] AI response error:', err.message);
      const errorMsg = 'Disculpa, tuve un problema procesando tu mensaje. Intenta de nuevo.';
      try {
        await this.sendMessage(remoteJid, errorMsg);
      } catch { /* best effort */ }
    }
  }
}

export const waManager = new WhatsAppManager();
