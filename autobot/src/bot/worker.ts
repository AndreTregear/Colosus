/**
 * Worker thread entry point — runs one Baileys instance per tenant.
 * Communicates with the main thread via parentPort messages.
 */
import { parentPort, workerData } from 'node:worker_threads';
import { BaileysProvider } from './providers/baileys.js';
import { usePostgresAuthState, clearAuthState } from './providers/pg-auth-state.js';
import type { WorkerCommand, WorkerEvent } from '../shared/types.js';

if (!parentPort) {
  throw new Error('worker.ts must be run as a worker thread');
}

const tenantId: string = workerData.tenantId;
const databaseUrl: string = workerData.databaseUrl;

// Override DATABASE_URL for this worker's pool connection
process.env.DATABASE_URL = databaseUrl;

let provider: BaileysProvider | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function send(event: WorkerEvent): void {
  parentPort!.postMessage(event);
}

// Exponential backoff state
let reconnectAttempts = 0;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RECONNECT_ATTEMPTS = 10;

function getBackoffDelay(): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, reconnectAttempts), MAX_DELAY_MS);
  // Add ±20% jitter
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

async function startProvider(): Promise<void> {
  const authState = await usePostgresAuthState(tenantId);

  provider = new BaileysProvider({
    tenantId,
    authState,

    onQr: (dataUrl) => {
      send({ type: 'qr', dataUrl });
    },

    onConnectionUpdate: (status, phone) => {
      send({ type: 'connection-update', status, phone });
      if (status === 'open') {
        reconnectAttempts = 0;
      }
    },

    onMessage: (message) => {
      send({ type: 'message', message });
    },

    onDisconnect: (_reason, loggedOut) => {
      if (loggedOut) {
        send({ type: 'error', error: 'Logged out — will not reconnect. Reset to re-pair.' });
        // Stop heartbeat so health check detects this is dead
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        return false;
      }

      reconnectAttempts++;
      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        send({ type: 'error', error: `Reconnect attempts exhausted after ${MAX_RECONNECT_ATTEMPTS} tries — stopping heartbeat for health check recovery` });
        // Stop heartbeat so WorkerBridge.isAlive() → false → health check respawns the worker
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        reconnectAttempts = 0; // Reset for when health check respawns
        return false;
      }

      const delay = getBackoffDelay();
      setTimeout(() => startProvider().catch(err => {
        send({ type: 'error', error: `Reconnect failed: ${(err as Error).message}` });
        // If startProvider() threw, the reconnect chain is broken but the heartbeat is
        // still running — health check won't detect it. Either schedule the next retry
        // or stop the heartbeat so the health check can respawn the worker.
        reconnectAttempts++;
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
          const nextDelay = getBackoffDelay();
          setTimeout(() => startProvider().catch(() => {}), nextDelay);
        } else {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          reconnectAttempts = 0;
        }
      }), delay);

      return true; // Signal that we're handling reconnection
    },
  });

  await provider.start();
}

async function stopProvider(): Promise<void> {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (provider) {
    await provider.stop();
    provider = null;
  }
  send({ type: 'stopped' });
}

// Handle commands from main thread
parentPort.on('message', async (cmd: WorkerCommand) => {
  try {
    switch (cmd.type) {
      case 'start':
        reconnectAttempts = 0;
        await startProvider();

        // Start heartbeat
        if (!heartbeatInterval) {
          heartbeatInterval = setInterval(() => {
            send({ type: 'heartbeat', timestamp: Date.now() });
          }, 10_000);
        }
        break;

      case 'stop':
        await stopProvider();
        break;

      case 'send-message':
        if (!provider) {
          if (cmd.requestId) {
            send({ type: 'send-result', requestId: cmd.requestId, success: false, error: 'Provider not running' });
          } else {
            send({ type: 'error', error: 'Provider not running' });
          }
          return;
        }
        try {
          await provider.sendText(cmd.jid, cmd.text);
          if (cmd.requestId) {
            send({ type: 'send-result', requestId: cmd.requestId, success: true });
          }
        } catch (err) {
          const errMsg = (err as Error).message;
          if (cmd.requestId) {
            send({ type: 'send-result', requestId: cmd.requestId, success: false, error: errMsg });
          } else {
            send({ type: 'error', error: errMsg });
          }
        }
        break;

      case 'send-image':
        if (!provider) {
          if (cmd.requestId) {
            send({ type: 'send-result', requestId: cmd.requestId, success: false, error: 'Provider not running' });
          } else {
            send({ type: 'error', error: 'Provider not running' });
          }
          return;
        }
        try {
          await provider.sendImage(cmd.jid, cmd.imagePath, cmd.caption);
          if (cmd.requestId) {
            send({ type: 'send-result', requestId: cmd.requestId, success: true });
          }
        } catch (err) {
          const errMsg = (err as Error).message;
          if (cmd.requestId) {
            send({ type: 'send-result', requestId: cmd.requestId, success: false, error: errMsg });
          } else {
            send({ type: 'error', error: errMsg });
          }
        }
        break;

      case 'send-presence':
        if (provider) {
          await provider.sendPresenceUpdate(cmd.jid, cmd.presenceType).catch(() => {});
        }
        break;

      case 'health-check':
        send({
          type: 'heartbeat',
          timestamp: Date.now(),
        });
        break;
    }
  } catch (err) {
    send({ type: 'error', error: (err as Error).message });
  }
});

// Signal readiness
send({ type: 'ready' });
