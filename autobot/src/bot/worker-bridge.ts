/**
 * WorkerBridge — main-thread proxy for a tenant's worker thread.
 * Wraps worker_threads Worker with typed message handling.
 */
import { Worker } from 'node:worker_threads';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { logger } from '../shared/logger.js';
import { appBus } from '../shared/events.js';
import * as sessionsRepo from '../db/sessions-repo.js';
import type { WorkerCommand, WorkerEvent } from '../shared/types.js';
import type { IncomingMessage } from './providers/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class WorkerBridge {
  readonly tenantId: string;
  private worker: Worker | null = null;
  private lastHeartbeat: number = 0;
  private startedAt: Date | null = null;
  private messagesHandled: number = 0;
  private latestQr: string | null = null;
  private onMessage: ((tenantId: string, msg: IncomingMessage) => void) | null = null;
  private pendingRequests = new Map<string, {
    resolve: () => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();

  private static readonly SEND_TIMEOUT_MS = 30_000;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  setMessageHandler(handler: (tenantId: string, msg: IncomingMessage) => void): void {
    this.onMessage = handler;
  }

  isAlive(): boolean {
    if (!this.worker) return false;
    // Stale if no heartbeat in last 30s
    return this.lastHeartbeat > 0 && Date.now() - this.lastHeartbeat < 30_000;
  }

  isRunning(): boolean {
    return this.worker !== null;
  }

  getLatestQr(): string | null {
    return this.latestQr;
  }

  getStartedAt(): Date | null {
    return this.startedAt;
  }

  getMessagesHandled(): number {
    return this.messagesHandled;
  }

  async start(databaseUrl: string): Promise<void> {
    if (this.worker) {
      logger.warn({ tenantId: this.tenantId }, 'Worker already running');
      return;
    }

    // Resolve worker script — detect by checking which file exists on disk
    const jsPath = path.resolve(__dirname, 'worker.js');
    const tsPath = path.resolve(__dirname, 'worker.ts');

    let workerPath: string;
    if (fs.existsSync(tsPath)) {
      workerPath = tsPath; // dev: running from src/ via tsx
    } else if (fs.existsSync(jsPath)) {
      workerPath = jsPath; // prod: compiled to dist/
    } else {
      throw new Error(`Worker script not found at ${tsPath} or ${jsPath}`);
    }

    const isTsx = workerPath.endsWith('.ts');

    return new Promise<void>((resolve, reject) => {
      const workerOptions: any = {
        workerData: { tenantId: this.tenantId, databaseUrl },
      };

      // When running via tsx, we need to use the tsx loader for the worker
      if (isTsx) {
        workerOptions.execArgv = ['--import', 'tsx'];
      }

      this.worker = new Worker(workerPath, workerOptions);

      const onReady = (event: WorkerEvent) => {
        if (event.type === 'ready') {
          this.worker!.removeListener('message', onReady);
          this.startedAt = new Date();
          this.lastHeartbeat = Date.now();
          resolve();
        }
      };

      this.worker.on('message', onReady);
      this.worker.on('message', (event: WorkerEvent) => this.handleWorkerEvent(event));

      this.worker.on('error', (err: Error) => {
        logger.error({ tenantId: this.tenantId, err }, 'Worker error');
        appBus.emit('tenant-error', this.tenantId, err.message);
      });

      this.worker.on('exit', (code) => {
        logger.info({ tenantId: this.tenantId, code }, 'Worker exited');
        this.worker = null;
        this.startedAt = null;
        this.latestQr = null;
        this.rejectAllPending('Worker exited');
        appBus.emit('tenant-stopped', this.tenantId);
        sessionsRepo.updateConnectionStatus(this.tenantId, 'disconnected').catch(() => {});
      });

      // Timeout if worker doesn't become ready
      setTimeout(() => {
        if (!this.startedAt) {
          reject(new Error('Worker failed to start within 15 seconds'));
          this.terminate();
        }
      }, 15_000);
    });
  }

  send(command: WorkerCommand): void {
    if (!this.worker) throw new Error(`Worker for tenant ${this.tenantId} is not running`);
    this.worker.postMessage(command);
  }

  async startSession(): Promise<void> {
    this.send({ type: 'start' });
    await sessionsRepo.updateConnectionStatus(this.tenantId, 'connecting');
  }

  async stopSession(): Promise<void> {
    this.send({ type: 'stop' });
    this.latestQr = null;
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`sendMessage timed out after ${WorkerBridge.SEND_TIMEOUT_MS}ms for ${jid}`));
      }, WorkerBridge.SEND_TIMEOUT_MS);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      try {
        this.send({ type: 'send-message', jid, text, requestId });
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(err);
      }
    });
  }

  async sendImage(jid: string, imagePath: string, caption?: string): Promise<void> {
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`sendImage timed out after ${WorkerBridge.SEND_TIMEOUT_MS}ms for ${jid}`));
      }, WorkerBridge.SEND_TIMEOUT_MS);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      try {
        this.send({ type: 'send-image', jid, imagePath, caption, requestId });
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(err);
      }
    });
  }

  sendPresenceUpdate(jid: string, type: 'composing' | 'paused'): void {
    if (!this.worker) return; // best-effort
    try {
      this.send({ type: 'send-presence', jid, presenceType: type });
    } catch { /* best-effort, don't throw */ }
  }

  async terminate(): Promise<void> {
    this.rejectAllPending('Worker terminated');
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.startedAt = null;
      this.latestQr = null;
    }
  }

  private rejectAllPending(reason: string): void {
    for (const [id, { reject, timer }] of this.pendingRequests) {
      clearTimeout(timer);
      reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  private handleWorkerEvent(event: WorkerEvent): void {
    switch (event.type) {
      case 'qr':
        this.latestQr = event.dataUrl;
        sessionsRepo.updateQrTimestamp(this.tenantId).catch(() => {});
        appBus.emit('qr', event.dataUrl);
        break;

      case 'connection-update':
        if (event.status === 'open') {
          this.latestQr = null;
        }
        sessionsRepo.updateConnectionStatus(this.tenantId, event.status === 'open' ? 'connected' : event.status === 'connecting' ? 'connecting' : 'disconnected', event.phone).catch(() => {});
        appBus.emit('connection-update', this.tenantId, event.status);
        if (event.status === 'open') {
          appBus.emit('tenant-started', this.tenantId);
        }
        break;

      case 'message':
        this.messagesHandled++;
        this.onMessage?.(this.tenantId, event.message);
        break;

      case 'send-result': {
        const pending = this.pendingRequests.get(event.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(event.requestId);
          if (event.success) {
            pending.resolve();
          } else {
            logger.warn({ tenantId: this.tenantId, error: event.error }, 'WhatsApp send failed');
            pending.reject(new Error(event.error || 'Send failed'));
          }
        }
        break;
      }

      case 'error':
        logger.error({ tenantId: this.tenantId }, `Worker error: ${event.error}`);
        sessionsRepo.setSessionError(this.tenantId, event.error).catch(() => {});
        appBus.emit('tenant-error', this.tenantId, event.error);
        break;

      case 'heartbeat':
        this.lastHeartbeat = event.timestamp;
        break;

      case 'stopped':
        this.latestQr = null;
        sessionsRepo.updateConnectionStatus(this.tenantId, 'disconnected').catch(() => {});
        appBus.emit('tenant-stopped', this.tenantId);
        break;
    }
  }
}
