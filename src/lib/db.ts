/**
 * db.ts — SQLite database singleton via better-sqlite3
 *
 * Why SQLite?
 * - Zero config, file-based persistence — perfect for a small personal tool
 * - better-sqlite3 is synchronous, avoiding async complexity in API routes
 * - Supports NUMERIC type for exact decimal storage (no float rounding)
 * - Works locally and on Vercel (with serverless caveats — see README)
 *
 * Money is stored as TEXT in "123.45" form and all arithmetic is done
 * with decimal.js to avoid IEEE 754 floating-point errors.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

function getDbPath(): string {
  // On Vercel, /tmp is the only writable directory
  const dir =
    process.env.NODE_ENV === "production" ? "/tmp" : path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "expenses.db");
}

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(getDbPath());

  // Enable WAL for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id           TEXT PRIMARY KEY,
      amount       TEXT NOT NULL,        -- decimal string e.g. "123.45"
      category     TEXT NOT NULL,
      description  TEXT NOT NULL,
      date         TEXT NOT NULL,        -- YYYY-MM-DD
      created_at   TEXT NOT NULL
    );

    -- Idempotency table: maps client-supplied key → expense id
    -- Prevents duplicate inserts on retry/refresh
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key          TEXT PRIMARY KEY,
      expense_id   TEXT NOT NULL,
      created_at   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  return db;
}
