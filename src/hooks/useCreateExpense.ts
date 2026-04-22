import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Expense, CreateExpenseInput } from "@/types";

interface UseCreateExpenseResult {
  createExpense: (data: Omit<CreateExpenseInput, "idempotency_key">) => Promise<Expense | null>;
  submitting: boolean;
  submitError: string | null;
  clearError: () => void;
}

export function useCreateExpense(): UseCreateExpenseResult {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Each form "session" gets a stable idempotency key generated once.
  // It's reset after a successful submission so the next entry gets a new key.
  const idempotencyKey = useRef<string>(uuidv4());

  const createExpense = async (
    data: Omit<CreateExpenseInput, "idempotency_key">
  ): Promise<Expense | null> => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/expenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          idempotency_key: idempotencyKey.current,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setSubmitError(body.error ?? "Failed to create expense");
        return null;
      }

      // Rotate key so next submission is treated as a new request
      idempotencyKey.current = uuidv4();
      return body as Expense;
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Network error — please try again"
      );
      return null;
      // Key is intentionally NOT rotated on network error so a retry
      // with the same key is safe (idempotent).
    } finally {
      setSubmitting(false);
    }
  };

  return {
    createExpense,
    submitting,
    submitError,
    clearError: () => setSubmitError(null),
  };
}
