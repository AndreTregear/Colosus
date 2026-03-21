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
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id  TEXT NOT NULL UNIQUE,
      api_key    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
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

export interface DeviceRow {
  id: number;
  device_id: string;
  api_key: string;
  created_at: string;
}

export function registerDevice(deviceId: string, apiKey: string): DeviceRow {
  const d = getDb();
  d.prepare(
    "INSERT INTO devices (device_id, api_key) VALUES (?, ?) ON CONFLICT(device_id) DO UPDATE SET api_key = excluded.api_key"
  ).run(deviceId, apiKey);
  return d
    .prepare("SELECT * FROM devices WHERE device_id = ?")
    .get(deviceId) as DeviceRow;
}

export function validateApiKey(apiKey: string): boolean {
  // Accept master key from env or device-specific key
  const masterKey = process.env.API_KEY;
  if (masterKey && apiKey === masterKey) return true;

  const device = getDb()
    .prepare("SELECT id FROM devices WHERE api_key = ?")
    .get(apiKey);
  return !!device;
}
