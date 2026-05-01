/**
 * In-memory store for pending confirmations with automatic TTL expiry.
 *
 * Keyed by `${tenantId}:${jid}` — only one pending confirmation per
 * tenant+contact at a time (latest wins).
 */
import crypto from 'node:crypto';
import type { PendingConfirmation, ConfirmationFields, ConfirmationAction, EditableField } from './types.js';

/** Confirmation expires after 10 minutes of inactivity. */
const CONFIRMATION_TTL_MS = 10 * 60 * 1000;

/** Cleanup interval — sweep expired entries every 2 minutes. */
const SWEEP_INTERVAL_MS = 2 * 60 * 1000;

class ConfirmationStore {
  private pending = new Map<string, PendingConfirmation>();
  private sweepTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    // Don't block process exit
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }

  private key(tenantId: string, jid: string): string {
    return `${tenantId}:${jid}`;
  }

  /** Create a new pending confirmation. Replaces any existing one for this tenant+jid. */
  create(
    tenantId: string,
    jid: string,
    action: ConfirmationAction,
    fields: ConfirmationFields,
    originalTranscription: string,
    isVoiceMessage: boolean,
  ): PendingConfirmation {
    const now = Date.now();
    const confirmation: PendingConfirmation = {
      id: crypto.randomUUID(),
      tenantId,
      jid,
      action,
      fields,
      state: 'pending',
      originalTranscription,
      isVoiceMessage,
      createdAt: now,
      updatedAt: now,
    };
    this.pending.set(this.key(tenantId, jid), confirmation);
    return confirmation;
  }

  /** Get the pending confirmation for a tenant+jid, or null if none/expired. */
  get(tenantId: string, jid: string): PendingConfirmation | null {
    const c = this.pending.get(this.key(tenantId, jid));
    if (!c) return null;
    if (Date.now() - c.updatedAt > CONFIRMATION_TTL_MS) {
      this.pending.delete(this.key(tenantId, jid));
      return null;
    }
    return c;
  }

  /** Check if a tenant+jid has a pending (non-terminal) confirmation. */
  hasPending(tenantId: string, jid: string): boolean {
    const c = this.get(tenantId, jid);
    return c !== null && c.state !== 'confirmed' && c.state !== 'cancelled';
  }

  /** Update the confirmation state. Returns the updated confirmation or null. */
  updateState(
    tenantId: string,
    jid: string,
    update: Partial<Pick<PendingConfirmation, 'state' | 'editingField' | 'fields'>>,
  ): PendingConfirmation | null {
    const c = this.get(tenantId, jid);
    if (!c) return null;
    Object.assign(c, update, { updatedAt: Date.now() });
    return c;
  }

  /** Update a single field value. */
  updateField(tenantId: string, jid: string, field: EditableField, value: unknown): PendingConfirmation | null {
    const c = this.get(tenantId, jid);
    if (!c) return null;

    switch (field) {
      case 'amount':
        c.fields.amount = Number(value) || c.fields.amount;
        break;
      case 'category':
        c.fields.category = String(value);
        break;
      case 'vendor':
        c.fields.vendor = String(value);
        break;
      case 'date':
        c.fields.date = String(value);
        break;
      case 'notes':
        c.fields.notes = String(value);
        break;
      case 'items':
        // Items editing is text-based — user re-describes the items
        // The caller is responsible for parsing and updating
        break;
    }

    c.updatedAt = Date.now();
    c.state = 'pending';
    c.editingField = undefined;
    return c;
  }

  /** Remove a confirmation (after commit or cancel). */
  remove(tenantId: string, jid: string): void {
    this.pending.delete(this.key(tenantId, jid));
  }

  /** Sweep expired entries. */
  private sweep(): void {
    const now = Date.now();
    for (const [key, c] of this.pending) {
      if (now - c.updatedAt > CONFIRMATION_TTL_MS) {
        this.pending.delete(key);
      }
    }
  }

  /** For testing — clear all entries. */
  clear(): void {
    this.pending.clear();
  }

  /** For testing — get count. */
  get size(): number {
    return this.pending.size;
  }

  destroy(): void {
    clearInterval(this.sweepTimer);
    this.pending.clear();
  }
}

export const confirmationStore = new ConfirmationStore();
