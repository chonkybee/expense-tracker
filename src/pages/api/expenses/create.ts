/**
 * POST /api/expenses
 *
 * Idempotency:
 *   Client must supply an `idempotency_key` (UUID v4) in the request body.
 *   If the same key is seen again (retry / page refresh), we return the
 *   already-created expense with HTTP 200 — no duplicate is inserted.
 *
 *   This protects against:
 *   - Double-click submissions
 *   - Network timeouts that cause the client to retry
 *   - Page refresh after a form submit
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import {
  validateAmount,
  validateCategory,
  validateDate,
  validateDescription,
  validateIdempotencyKey,
} from "@/lib/validation";
import type { Expense, ApiError } from "@/types";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Expense | ApiError>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idempotency_key, amount, category, description, date } = req.body ?? {};

  // --- Validation ---
  const checks = [
    validateIdempotencyKey(idempotency_key),
    validateAmount(amount),
    validateCategory(category),
    validateDescription(description),
    validateDate(date),
  ];
  const failed = checks.find((c) => !c.valid);
  if (failed) return res.status(400).json({ error: failed.error! });

  const key = String(idempotency_key).trim();
  const db = getDb();

  // --- Idempotency check (atomic via SQLite transaction) ---
  const result = db.transaction(() => {
    const existing = db
      .prepare(`SELECT expense_id FROM idempotency_keys WHERE key = ?`)
      .get(key) as { expense_id: string } | undefined;

    if (existing) {
      // Return the previously created expense
      return db
        .prepare(`SELECT * FROM expenses WHERE id = ?`)
        .get(existing.expense_id) as Expense;
    }

    // New expense
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const amountStr = String(amount).trim();
    const categoryStr = String(category).trim();
    const descStr = String(description).trim();
    const dateStr = String(date).trim();

    db.prepare(
      `INSERT INTO expenses (id, amount, category, description, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, amountStr, categoryStr, descStr, dateStr, created_at);

    db.prepare(
      `INSERT INTO idempotency_keys (key, expense_id, created_at) VALUES (?, ?, ?)`
    ).run(key, id, created_at);

    return db
      .prepare(`SELECT * FROM expenses WHERE id = ?`)
      .get(id) as Expense;
  })();

  return res.status(200).json(result);
}
