import { Router } from 'express';
import { appBus } from '../../shared/events.js';
import { logger } from '../../shared/logger.js';

const router = Router();

let latestQrDataUrl: string | null = null;
let connected = false;

appBus.on('qr', (dataUrl) => {
  logger.debug({ qrLength: dataUrl?.length }, 'QR code event received');
  latestQrDataUrl = dataUrl;
  connected = false;
});

appBus.on('connection-update', (state) => {
  logger.debug({ state }, 'QR route: connection-update event');
  if (state === 'open') {
    latestQrDataUrl = null;
    connected = true;
  } else if (state === 'close') {
    connected = false;
  }
});

router.get('/', (_req, res) => {
  const status = connected ? 'connected' : latestQrDataUrl ? 'waiting' : 'disconnected';
  logger.debug({ status, hasQr: !!latestQrDataUrl }, 'QR status requested');
  if (connected) {
    res.json({ status: 'connected', qr: null });
  } else if (latestQrDataUrl) {
    res.json({ status: 'waiting', qr: latestQrDataUrl });
  } else {
    res.json({ status: 'disconnected', qr: null });
  }
});

export { router as qrRouter };
