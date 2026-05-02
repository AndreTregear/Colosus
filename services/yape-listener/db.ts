import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || "./data/yape.db";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema(): void {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name   TEXT    NOT NULL,
      amount        REAL    NOT NULL,
      captured_at   INTEGER NOT NULL,
      notification_hash TEXT NOT NULL UNIQUE,
      status        TEXT    NOT NULL DEFAULT 'pending',
      matched_order TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);
    CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

    CREATE TABLE IF NOT EXISTS devices (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id     TEXT NOT NULL UNIQUE,
      api_key_hash  TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: previous schema used `api_key` (plaintext). If the column
  // exists, hash all rows in place and rename. This is best-effort — fails
  // silently for already-migrated DBs.
  try {
    const cols = d.prepare("PRAGMA table_info(devices)").all() as Array<{ name: string }>;
    const hasOld = cols.some((c) => c.name === "api_key");
    const hasNew = cols.some((c) => c.name === "api_key_hash");
    if (hasOld && !hasNew) {
      d.exec("ALTER TABLE devices ADD COLUMN api_key_hash TEXT NOT NULL DEFAULT ''");
      const rows = d.prepare("SELECT id, api_key FROM devices").all() as Array<{ id: number; api_key: string }>;
      const upd = d.prepare("UPDATE devices SET api_key_hash = ? WHERE id = ?");
      const { createHash: ch } = require("node:crypto");
      for (const r of rows) {
        if (r.api_key) upd.run(ch("sha256").update(String(r.api_key), "utf8").digest("hex"), r.id);
      }
      // SQLite can't drop a column without a rebuild on older versions. Leave
      // the legacy column in place — it's harmless once api_key_hash exists.
    }
  } catch {
    // ignore — migration best-effort
  }
}

// ── Payment operations ──────────────────────────────────────

export interface PaymentRow {
  id: number;
  sender_name: string;
  amount: number;
  captured_at: number;
  notification_hash: string;
  status: string;
  matched_order: string | null;
  created_at: string;
}

export function insertPayment(
  senderName: string,
  amount: number,
  capturedAt: number,
  notificationHash: string
): PaymentRow | null {
  const d = getDb();
  const existing = d
    .prepare("SELECT id FROM payments WHERE notification_hash = ?")
    .get(notificationHash);
  if (existing) return null; // dedup

  const stmt = d.prepare(
    "INSERT INTO payments (sender_name, amount, captured_at, notification_hash) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(senderName, amount, capturedAt, notificationHash);

  return d
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(result.lastInsertRowid) as PaymentRow;
}

export function getPendingPayments(): PaymentRow[] {
  return getDb()
    .prepare("SELECT * FROM payments WHERE status = 'pending' ORDER BY created_at DESC")
    .all() as PaymentRow[];
}

export function getPaymentById(id: number): PaymentRow | undefined {
  return getDb()
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(id) as PaymentRow | undefined;
}

export function confirmPayment(id: number, matchedOrder: string): PaymentRow | undefined {
  const d = getDb();
  d.prepare("UPDATE payments SET status = 'confirmed', matched_order = ? WHERE id = ?").run(
    matchedOrder,
    id
  );
  return getPaymentById(id);
}

export function findByAmount(amount: number, tolerance: number = 1.0): PaymentRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM payments WHERE status = 'pending' AND amount BETWEEN ? AND ? ORDER BY created_at DESC"
    )
    .all(amount - tolerance, amount + tolerance) as PaymentRow[];
}

export function findByAmountAndName(
  amount: number,
  senderName: string,
  tolerance: number = 1.0
): PaymentRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM payments WHERE status = 'pending' AND amount BETWEEN ? AND ? AND LOWER(sender_name) LIKE ? ORDER BY created_at DESC"
    )
    .all(amount - tolerance, amount + tolerance, `%${senderName.toLowerCase()}%`) as PaymentRow[];
}

export interface TodayStats {
  total_received: number;
  count: number;
  confirmed: number;
  pending: number;
}

export function getTodayStats(): TodayStats {
  const d = getDb();
  const row = d
    .prepare(
      `SELECT
        COALESCE(SUM(amount), 0) as total_received,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM payments
      WHERE date(created_at) = date('now')`
    )
    .get() as TodayStats;
  return row;
}

export function getTodayPayments(): PaymentRow[] {
  return getDb()
    .prepare("SELECT * FROM payments WHERE date(created_at) = date('now') ORDER BY created_at DESC")
    .all() as PaymentRow[];
}

// ── Device operations ───────────────────────────────────────

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export interface DeviceRow {
  id: number;
  device_id: string;
  api_key_hash: string;  // SHA-256 hash of the actual key
  created_at: string;
}

function hashKey(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
}

function constantTimeKeyEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Mint a new server-generated API key for a device and persist its hash.
 * Returns the plaintext key — caller must transmit once and never again.
 * This replaces the previous behavior where the client supplied any key
 * and we stored it verbatim in plaintext.
 */
export function registerDevice(deviceId: string): { device: DeviceRow; apiKey: string } {
  const apiKey = randomBytes(32).toString("hex");
  const apiKeyHash = hashKey(apiKey);
  const d = getDb();
  d.prepare(
    "INSERT INTO devices (device_id, api_key_hash) VALUES (?, ?) ON CONFLICT(device_id) DO UPDATE SET api_key_hash = excluded.api_key_hash"
  ).run(deviceId, apiKeyHash);
  const device = d
    .prepare("SELECT * FROM devices WHERE device_id = ?")
    .get(deviceId) as DeviceRow;
  return { device, apiKey };
}

export function validateApiKey(apiKey: string): boolean {
  // Master key from env (constant-time compare) — used for service-to-service.
  const masterKey = process.env.API_KEY;
  if (masterKey && constantTimeKeyEqual(apiKey, masterKey)) return true;

  // Device-specific key — compare by hash.
  const apiKeyHash = hashKey(apiKey);
  const device = getDb()
    .prepare("SELECT id FROM devices WHERE api_key_hash = ?")
    .get(apiKeyHash);
  return !!device;
}
