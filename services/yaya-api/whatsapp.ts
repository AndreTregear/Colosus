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
import * as db from './db.js';
import { chat } from './ai.js';
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

  private async handleMessage(raw: proto.IWebMessageInfo, userId: string): Promise<void> {
    if (!raw.key || !raw.key.remoteJid || !raw.message) return;

    const remoteJid = raw.key.remoteJid;
    if (remoteJid === 'status@broadcast') return;

    // Skip bot's own outgoing messages
    const selfPhone = this.sock?.user?.id?.split('@')[0]?.split(':')[0] ?? '';
    const remoteLocal = remoteJid.split('@')[0];
    if (raw.key.fromMe && remoteLocal !== selfPhone) return;

    // Extract text
    const text = raw.message.conversation
      || raw.message.extendedTextMessage?.text
      || raw.message.imageMessage?.caption
      || null;

    if (!text) return; // skip non-text for now

    const contactName = raw.pushName || remoteLocal;
    const fromMe = raw.key.fromMe ?? false;

    // Store incoming message
    const msgId = `wa_${crypto.randomUUID().slice(0, 12)}`;
    db.insertWaMessage(msgId, userId, remoteJid, contactName, fromMe, text, 'text');

    // Broadcast to web UI
    broadcast('wa:message', {
      id: msgId,
      remote_jid: remoteJid,
      contact_name: contactName,
      from_me: fromMe,
      content: text,
      created_at: new Date().toISOString(),
    });

    // Don't process our own messages
    if (fromMe) return;

    // Check if onboarding is needed
    if (isOnboarding(userId)) {
      const response = await handleOnboardingMessage(userId, text, contactName);
      if (response) {
        await this.sendMessage(remoteJid, response);
        const respId = `wa_${crypto.randomUUID().slice(0, 12)}`;
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

      const response = await chat(userId, text);
      const aiText = response.content;

      // Send AI response via WhatsApp
      await this.sendMessage(remoteJid, aiText);

      // Store AI response
      const respId = `wa_${crypto.randomUUID().slice(0, 12)}`;
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
