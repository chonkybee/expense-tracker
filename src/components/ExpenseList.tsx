import React from "react";
import type { Expense } from "@/types";
import styles from "./ExpenseList.module.css";

interface ExpenseListProps {
  expenses: Expense[];
  total: string;
  loading: boolean;
  error: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Food & Dining": "🍽",
  Transport: "🚗",
  Shopping: "🛍",
  Entertainment: "🎬",
  Health: "💊",
  Utilities: "💡",
  Housing: "🏠",
  Education: "📚",
  Travel: "✈️",
  Other: "📌",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00"); // avoid timezone shift
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpenseList({ expenses, total, loading, error }: ExpenseListProps) {
  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p>Loading expenses…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.state} ${styles.errorState}`}>
        <span>⚠</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.count}>
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
        </span>
        <span className={styles.total}>
          Total: <strong>₹{Number(total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className={styles.empty}>
          <span>💸</span>
          <p>No expenses yet. Add one above!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {expenses.map((expense) => (
            <div key={expense.id} className={styles.item}>
              <div className={styles.icon}>
                {CATEGORY_ICONS[expense.category] ?? "📌"}
              </div>
              <div className={styles.meta}>
                <span className={styles.desc}>{expense.description}</span>
                <span className={styles.catDate}>
                  <span className={styles.badge}>{expense.category}</span>
                  <span className={styles.date}>{formatDate(expense.date)}</span>
                </span>
              </div>
              <div className={styles.amount}>
                ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
