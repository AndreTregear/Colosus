import { Router } from 'express';
import { appBus } from '../../shared/events.js';

const router = Router();

let latestQrDataUrl: string | null = null;
let connected = false;

appBus.on('qr', (dataUrl) => {
  latestQrDataUrl = dataUrl;
  connected = false;
});

appBus.on('connection-update', (state) => {
  if (state === 'open') {
    latestQrDataUrl = null;
    connected = true;
  } else if (state === 'close') {
    connected = false;
  }
});

router.get('/', (_req, res) => {
  if (connected) {
    res.json({ status: 'connected', qr: null });
  } else if (latestQrDataUrl) {
    res.json({ status: 'waiting', qr: latestQrDataUrl });
  } else {
    res.json({ status: 'disconnected', qr: null });
  }
});

export { router as qrRouter };
