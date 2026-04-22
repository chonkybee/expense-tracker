# Spendwise — Personal Expense Tracker

A minimal full-stack expense tracking tool. Built with Next.js (API routes + React frontend), SQLite via `better-sqlite3`, and deployed on Vercel.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # run unit + integration tests
npm run build      # production build
```

---

## Features

- Add expenses with amount, category, description, and date
- View all expenses in a live-updated list
- Filter by category
- Sort by date (newest or oldest first)
- Running total for the currently visible list
- Category breakdown with proportional bar chart
- Idempotent submission (safe to retry, refresh, or double-click)

---

## Key Design Decisions

### 1. Persistence: SQLite via `better-sqlite3`

**Why SQLite?**

This is a personal finance tool — single user, moderate data volume. SQLite is:

- **Zero-config**: No server to spin up, no connection pool to manage.
- **Synchronous**: `better-sqlite3` exposes a sync API that avoids async complexity in Next.js API routes and makes transaction logic easy to reason about.
- **Correct for money**: Amounts are stored as `TEXT` (e.g. `"123.45"`) and all arithmetic uses [`decimal.js`](https://mikemcl.github.io/decimal.js/) — no IEEE 754 float rounding errors.
- **Durable**: WAL mode enabled for better read concurrency and crash recovery.

**Vercel caveat**: Vercel's serverless functions have a read-only filesystem except for `/tmp`. The DB is written there in production. This means data resets on cold deployments. For a real production deployment, you'd swap `better-sqlite3` for a hosted database (PlanetScale, Supabase, Turso/libsql). The DB layer is intentionally isolated in `src/lib/db.ts` to make this swap straightforward.

### 2. Idempotency via client-supplied key

The `POST /api/expenses/create` endpoint requires an `idempotency_key` (UUID) in the request body. The frontend generates one per form "session" using `uuid` and only rotates it after a **successful** response.

**What this protects against:**
- Double-click submissions
- Network timeouts where the client retries
- Page refresh immediately after a submit (key is held in a `useRef` — not `localStorage` — so it survives a React remount but not a hard page reload; the latter is acceptable since the user can see whether the entry was saved)

The `idempotency_keys` table maps `key → expense_id`. On duplicate key, the already-created expense is returned with HTTP 200 — no duplicate is inserted. The lookup + insert is wrapped in a single SQLite transaction for atomicity.

### 3. Money handling

All monetary amounts flow through the system as **decimal strings** (`"123.45"`). The DB column is `TEXT`. The API accepts and returns strings. All aggregation (totals, category sums) is done with `decimal.js` — never native JS `Number` addition.

This eliminates the classic `0.1 + 0.2 = 0.30000000000000004` class of bugs. There's a dedicated test case for this.

### 4. API structure

Two endpoints, file-per-route:

| Route | File |
|---|---|
| `GET /api/expenses` | `src/pages/api/expenses/index.ts` |
| `POST /api/expenses/create` | `src/pages/api/expenses/create.ts` |

Separation keeps each handler focused. The `GET` handler validates the optional `category` query param against the known category list to prevent SQL injection via string interpolation (parameterised queries are also used).

### 5. Frontend data flow

- `useExpenses` hook: fetches list + total, re-fetches when filter/sort changes.
- `useCreateExpense` hook: manages submit state, idempotency key lifecycle, error display.
- Both hooks are custom React hooks — no external state library needed at this scale.

---

## Trade-offs Made

| Decision | What was traded |
|---|---|
| SQLite on `/tmp` for Vercel | Data doesn't persist across cold starts. Fine for a demo; swap DB for production. |
| No auth | This is a single-user personal tool. Adding auth would double the scope. |
| In-memory idempotency key (not `localStorage`) | A hard browser refresh before a successful response could allow a duplicate. Acceptable UX trade-off vs. the complexity of persisting keys client-side. |
| `better-sqlite3` (sync) over Prisma/Drizzle | Less abstraction, simpler mental model. Easy to replace when the DB changes. |
| No pagination | Premature for a personal tool. A single user won't have thousands of entries quickly. |
| CSS Modules over Tailwind | Zero build config, no purge concerns, co-located with components. |

---

## Intentionally Not Done

- **Authentication / multi-user support** — out of scope for a personal tool in this timeframe
- **Expense deletion / editing** — not in the acceptance criteria; would add significant UI complexity
- **Pagination** — premature optimisation
- **Offline / service worker support** — the idempotency handling covers the most common network-unreliability scenarios
- **E2E / browser tests** — unit + integration tests cover the logic; Playwright/Cypress would be the next step

---

## Project Structure

```
src/
├── __tests__/
│   ├── validation.test.ts   # Unit tests for input validation
│   └── expenses.test.ts     # Integration tests for API logic + idempotency
├── components/
│   ├── ExpenseForm.tsx       # Add expense form
│   ├── ExpenseList.tsx       # Expense list with loading/error states
│   └── CategorySummary.tsx  # Per-category breakdown
├── hooks/
│   ├── useExpenses.ts        # Data fetching hook
│   └── useCreateExpense.ts  # Mutation hook with idempotency
├── lib/
│   ├── db.ts                 # SQLite singleton
│   └── validation.ts         # Pure validation functions
├── pages/
│   ├── api/expenses/
│   │   ├── index.ts          # GET /api/expenses
│   │   └── create.ts         # POST /api/expenses/create
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx             # Main page
└── types/
    └── index.ts              # Shared TypeScript types

```

## 🚀 Live Demo

https://expense-tracker-ezyj.onrender.com/

---
