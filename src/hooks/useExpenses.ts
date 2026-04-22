import { useState, useEffect, useCallback } from "react";
import type { Expense, ExpenseListResponse } from "@/types";

interface UseExpensesOptions {
  category?: string;
  sort?: "date_desc" | "date_asc";
}

interface UseExpensesResult {
  expenses: Expense[];
  total: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExpenses({ category, sort = "date_desc" }: UseExpensesOptions = {}): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to fetch expenses");
      }
      const data: ExpenseListResponse = await res.json();
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { expenses, total, loading, error, refetch: fetch_ };
}
