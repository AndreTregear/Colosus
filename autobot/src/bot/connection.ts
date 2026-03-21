import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { AUTH_DIR } from '../config.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';
import { handleIncomingMessage } from './handler.js';

let sock: WASocket | null = null;
let shouldReconnect = true;
let connectionState: 'open' | 'connecting' | 'close' = 'close';
let startedAt: Date | null = null;
let messagesHandled = 0;
let phoneNumber: string | null = null;

export function getBotState(): {
  socket: WASocket | null;
  connectionState: 'open' | 'connecting' | 'close';
  startedAt: Date | null;
  messagesHandled: number;
  phoneNumber: string | null;
  running: boolean;
} {
  return {
    socket: sock,
    connectionState,
    startedAt,
    messagesHandled,
    phoneNumber,
    running: sock !== null,
  };
}

export function incrementMessagesHandled(): void {
  messagesHandled++;
}

export async function startBot(): Promise<void> {
  if (sock) {
    logger.warn('Bot is already running');
    return;
  }

  shouldReconnect = true;
  startedAt = new Date();
  connectionState = 'connecting';
  appBus.emit('connection-update', 'single-tenant', 'connecting');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }) as any,
    browser: ['Autobot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { width: 300 });
      appBus.emit('qr', dataUrl);
      logger.info('QR code generated — scan with WhatsApp');
    }

    if (connection === 'open') {
      connectionState = 'open';
      phoneNumber = sock?.user?.id?.split(':')[0] ?? null;
      appBus.emit('connection-update', 'single-tenant', 'open');
      appBus.emit('bot-started');
      logger.info(`Connected as ${phoneNumber}`);
    }

    if (connection === 'close') {
      connectionState = 'close';
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        shouldReconnect = false;
        logger.warn('Logged out — will not reconnect. Restart to re-pair.');
      }

      sock = null;
      appBus.emit('connection-update', 'single-tenant', 'close');

      if (shouldReconnect) {
        logger.info('Reconnecting in 3 seconds...');
        setTimeout(() => startBot(), 3000);
      } else {
        appBus.emit('bot-stopped');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleIncomingMessage(sock!, msg);
    }
  });
}

export async function stopBot(): Promise<void> {
  shouldReconnect = false;
  if (sock) {
    sock.end(undefined);
    sock = null;
  }
  connectionState = 'close';
  startedAt = null;
  messagesHandled = 0;
  phoneNumber = null;
  appBus.emit('bot-stopped');
  appBus.emit('connection-update', 'single-tenant', 'close');
  logger.info('Bot stopped');
}
