/**
 * GET /api/expenses
 *
 * Query params:
 *   category   — filter by exact category name
 *   sort        — "date_desc" (default) or "date_asc"
 *
 * Returns: { expenses: Expense[], total: string }
 * Total is computed in JS with decimal.js for exact arithmetic.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import Decimal from "decimal.js";
import { getDb } from "@/lib/db";
import type { Expense, ExpenseListResponse, ApiError } from "@/types";
import { CATEGORIES } from "@/types";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExpenseListResponse | ApiError>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, sort } = req.query;

  // Validate optional category filter
  if (category && !(CATEGORIES as readonly string[]).includes(String(category))) {
    return res.status(400).json({ error: "Invalid category filter" });
  }

  const sortOrder =
    sort === "date_asc" ? "ASC" : "DESC"; // default newest first

  const db = getDb();

  let sql = `SELECT * FROM expenses`;
  const params: string[] = [];

  if (category) {
    sql += ` WHERE category = ?`;
    params.push(String(category));
  }

  sql += ` ORDER BY date ${sortOrder}, created_at ${sortOrder}`;

  const expenses = db.prepare(sql).all(...params) as Expense[];

  // Sum with exact decimal arithmetic
  const total = expenses
    .reduce((acc, e) => acc.plus(new Decimal(e.amount)), new Decimal(0))
    .toFixed(2);

  // No-cache header so list is always fresh
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ expenses, total });
}
