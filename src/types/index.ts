export interface Expense {
  id: string;
  amount: string; // stored as string to preserve decimal precision (from DB numeric)
  category: string;
  description: string;
  date: string; // ISO date string YYYY-MM-DD
  created_at: string; // ISO datetime string
}

export interface CreateExpenseInput {
  idempotency_key: string;
  amount: string; // decimal string e.g. "123.45"
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: string; // sum as decimal string
}

export interface ApiError {
  error: string;
  details?: string;
}

export const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Housing",
  "Education",
  "Travel",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
