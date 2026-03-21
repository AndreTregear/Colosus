import express from "express";
import cors from "cors";
import {
  insertPayment,
  getPendingPayments,
  getPaymentById,
  confirmPayment,
  findByAmount,
  getTodayStats,
  getTodayPayments,
  registerDevice,
  validateApiKey,
  getDb,
} from "./db.js";
import { matchByAmount, matchByAmountAndName } from "./matcher.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

// ── Auth middleware ──────────────────────────────────────────

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const apiKey =
    req.headers["x-api-key"] as string ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!apiKey) {
    res.status(401).json({ error: "Missing API key" });
    return;
  }

  if (!validateApiKey(apiKey)) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  next();
}

// ── Health (no auth) ────────────────────────────────────────

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "yape-listener", timestamp: new Date().toISOString() });
});

// ── All other routes require auth ───────────────────────────

app.use("/api/v1/payments", authMiddleware);
app.use("/api/v1/yape/payments", authMiddleware); // backward compat
app.use("/api/v1/devices", authMiddleware);

// ── POST /api/v1/payments/sync ──────────────────────────────
// Also aliased at /api/v1/yape/payments/sync for Android backward compat

function handleSync(req: express.Request, res: express.Response): void {
  const { senderName, amount, capturedAt, notificationHash } = req.body;

  if (!senderName || amount == null || !capturedAt || !notificationHash) {
    res.status(400).json({ error: "Missing required fields: senderName, amount, capturedAt, notificationHash" });
    return;
  }

  const payment = insertPayment(senderName, amount, capturedAt, notificationHash);
  if (!payment) {
    // Dedup — already exists, return success anyway (idempotent)
    res.json({ id: "duplicate", status: "already_synced" });
    return;
  }

  res.status(201).json({ id: String(payment.id), status: "synced" });
}

app.post("/api/v1/payments/sync", handleSync);
app.post("/api/v1/yape/payments/sync", handleSync);

// ── POST /api/v1/payments/batch-sync ────────────────────────

function handleBatchSync(req: express.Request, res: express.Response): void {
  const { payments } = req.body;

  if (!Array.isArray(payments) || payments.length === 0) {
    res.status(400).json({ error: "payments array required" });
    return;
  }

  const results = payments.map((p: any) => {
    if (!p.senderName || p.amount == null || !p.capturedAt || !p.notificationHash) {
      return { id: "error", status: "invalid_fields" };
    }
    const payment = insertPayment(p.senderName, p.amount, p.capturedAt, p.notificationHash);
    if (!payment) {
      return { id: "duplicate", status: "already_synced" };
    }
    return { id: String(payment.id), status: "synced" };
  });

  res.status(201).json({ results });
}

app.post("/api/v1/payments/batch-sync", handleBatchSync);
app.post("/api/v1/yape/payments/sync/batch", handleBatchSync);

// ── GET /api/v1/payments/pending ────────────────────────────

app.get("/api/v1/payments/pending", (_req, res) => {
  const payments = getPendingPayments();
  res.json({ payments, count: payments.length });
});

// ── GET /api/v1/payments/match?amount=X&name=Y ─────────────

app.get("/api/v1/payments/match", (req, res) => {
  const amount = parseFloat(req.query.amount as string);
  if (isNaN(amount)) {
    res.status(400).json({ error: "amount query parameter required" });
    return;
  }

  const tolerance = parseFloat(req.query.tolerance as string) || 1.0;
  const name = req.query.name as string | undefined;

  const result = name
    ? matchByAmountAndName(amount, name, tolerance)
    : matchByAmount(amount, tolerance);

  res.json(result);
});

// ── POST /api/v1/payments/confirm/:id ───────────────────────

app.post("/api/v1/payments/confirm/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid payment ID" });
    return;
  }

  const existing = getPaymentById(id);
  if (!existing) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  if (existing.status === "confirmed") {
    res.json({ payment: existing, message: "Already confirmed" });
    return;
  }

  const orderDescription = req.body.orderDescription || req.body.matched_order || "manual_confirm";
  const updated = confirmPayment(id, orderDescription);
  res.json({ payment: updated });
});

// ── GET /api/v1/payments/stats ──────────────────────────────

app.get("/api/v1/payments/stats", (_req, res) => {
  const stats = getTodayStats();
  const payments = getTodayPayments();
  res.json({ ...stats, payments });
});

// ── POST /api/v1/devices/register ───────────────────────────

app.post("/api/v1/devices/register", (req, res) => {
  const { deviceId, apiKey } = req.body;
  if (!deviceId || !apiKey) {
    res.status(400).json({ error: "deviceId and apiKey required" });
    return;
  }

  const device = registerDevice(deviceId, apiKey);
  res.status(201).json({ device });
});

// ── Start ───────────────────────────────────────────────────

app.listen(PORT, () => {
  // Ensure DB is initialized on startup
  getDb();
  console.log(`yape-listener running on port ${PORT}`);
});
