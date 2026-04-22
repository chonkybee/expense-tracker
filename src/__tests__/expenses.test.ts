/**
 * Integration tests for expense API logic.
 * Uses an in-memory SQLite DB (not the production file) to keep tests isolated.
 */

import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";

// ---- Minimal inline DB setup (mirrors db.ts) ----
function createTestDb() {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE expenses (
      id TEXT PRIMARY KEY, amount TEXT NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL, date TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE idempotency_keys (
      key TEXT PRIMARY KEY, expense_id TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
  return db;
}

// ---- Inline API logic (mirrors pages/api/expenses/create.ts) ----
type DB = ReturnType<typeof createTestDb>;
interface Expense { id: string; amount: string; category: string; description: string; date: string; created_at: string; }

function createExpense(db: DB, input: { idempotency_key: string; amount: string; category: string; description: string; date: string }) {
  return db.transaction(() => {
    const existing = db.prepare(`SELECT expense_id FROM idempotency_keys WHERE key = ?`).get(input.idempotency_key) as { expense_id: string } | undefined;
    if (existing) return db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(existing.expense_id) as Expense;

    const id = uuidv4();
    const created_at = new Date().toISOString();
    db.prepare(`INSERT INTO expenses (id,amount,category,description,date,created_at) VALUES (?,?,?,?,?,?)`).run(id, input.amount, input.category, input.description, input.date, created_at);
    db.prepare(`INSERT INTO idempotency_keys (key,expense_id,created_at) VALUES (?,?,?)`).run(input.idempotency_key, id, created_at);
    return db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(id) as Expense;
  })();
}

function listExpenses(db: DB, opts: { category?: string; sort?: string } = {}) {
  const sortOrder = opts.sort === "date_asc" ? "ASC" : "DESC";
  let sql = `SELECT * FROM expenses`;
  const params: string[] = [];
  if (opts.category) { sql += ` WHERE category = ?`; params.push(opts.category); }
  sql += ` ORDER BY date ${sortOrder}, created_at ${sortOrder}`;
  const expenses = db.prepare(sql).all(...params) as Expense[];
  const total = expenses.reduce((acc, e) => acc.plus(new Decimal(e.amount)), new Decimal(0)).toFixed(2);
  return { expenses, total };
}

// ---- Tests ----

describe("createExpense", () => {
  it("creates a new expense and returns it", () => {
    const db = createTestDb();
    const key = uuidv4();
    const expense = createExpense(db, { idempotency_key: key, amount: "150.00", category: "Food & Dining", description: "Lunch", date: "2024-03-01" });
    expect(expense.id).toBeDefined();
    expect(expense.amount).toBe("150.00");
    expect(expense.category).toBe("Food & Dining");
  });

  it("is idempotent: returns same expense on retry with same key", () => {
    const db = createTestDb();
    const key = uuidv4();
    const payload = { idempotency_key: key, amount: "200.00", category: "Transport", description: "Uber", date: "2024-03-02" };
    const first = createExpense(db, payload);
    const second = createExpense(db, payload);
    expect(first.id).toBe(second.id);
    const count = (db.prepare(`SELECT COUNT(*) as c FROM expenses`).get() as { c: number }).c;
    expect(count).toBe(1); // no duplicate
  });

  it("allows two different expenses with different keys", () => {
    const db = createTestDb();
    createExpense(db, { idempotency_key: uuidv4(), amount: "50.00", category: "Other", description: "A", date: "2024-03-01" });
    createExpense(db, { idempotency_key: uuidv4(), amount: "75.00", category: "Other", description: "B", date: "2024-03-02" });
    const { expenses } = listExpenses(db);
    expect(expenses.length).toBe(2);
  });
});

describe("listExpenses", () => {
  function seedDb(db: DB) {
    createExpense(db, { idempotency_key: uuidv4(), amount: "100.00", category: "Food & Dining", description: "Dinner", date: "2024-03-03" });
    createExpense(db, { idempotency_key: uuidv4(), amount: "250.50", category: "Transport", description: "Flight", date: "2024-03-01" });
    createExpense(db, { idempotency_key: uuidv4(), amount: "45.00", category: "Food & Dining", description: "Lunch", date: "2024-03-02" });
  }

  it("returns all expenses and correct total", () => {
    const db = createTestDb();
    seedDb(db);
    const { expenses, total } = listExpenses(db);
    expect(expenses.length).toBe(3);
    expect(total).toBe("395.50");
  });

  it("filters by category", () => {
    const db = createTestDb();
    seedDb(db);
    const { expenses, total } = listExpenses(db, { category: "Food & Dining" });
    expect(expenses.length).toBe(2);
    expect(total).toBe("145.00");
  });

  it("sorts newest first by default", () => {
    const db = createTestDb();
    seedDb(db);
    const { expenses } = listExpenses(db, { sort: "date_desc" });
    expect(expenses[0].date).toBe("2024-03-03");
    expect(expenses[expenses.length - 1].date).toBe("2024-03-01");
  });

  it("sorts oldest first when requested", () => {
    const db = createTestDb();
    seedDb(db);
    const { expenses } = listExpenses(db, { sort: "date_asc" });
    expect(expenses[0].date).toBe("2024-03-01");
  });

  it("total is 0.00 for empty list", () => {
    const db = createTestDb();
    const { total } = listExpenses(db);
    expect(total).toBe("0.00");
  });
});

describe("decimal money handling", () => {
  it("sums amounts without floating point errors", () => {
    const db = createTestDb();
    // Classic float trap: 0.1 + 0.2 = 0.30000000000000004 in JS
    createExpense(db, { idempotency_key: uuidv4(), amount: "0.10", category: "Other", description: "a", date: "2024-01-01" });
    createExpense(db, { idempotency_key: uuidv4(), amount: "0.20", category: "Other", description: "b", date: "2024-01-01" });
    const { total } = listExpenses(db);
    expect(total).toBe("0.30"); // not "0.30000000000000004"
  });
});
