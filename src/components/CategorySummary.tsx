import React from "react";
import type { Expense } from "@/types";
import Decimal from "decimal.js";
import styles from "./CategorySummary.module.css";

interface CategorySummaryProps {
  expenses: Expense[];
}

export default function CategorySummary({ expenses }: CategorySummaryProps) {
  if (expenses.length === 0) return null;

  // Aggregate by category
  const map = new Map<string, Decimal>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? new Decimal(0)).plus(new Decimal(e.amount)));
  }

  const grand = [...map.values()].reduce((a, b) => a.plus(b), new Decimal(0));
  const sorted = [...map.entries()].sort((a, b) => b[1].comparedTo(a[1]));

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>By Category</h3>
      <div className={styles.rows}>
        {sorted.map(([cat, sum]) => {
          const pct = grand.gt(0) ? sum.div(grand).times(100).toFixed(1) : "0.0";
          return (
            <div key={cat} className={styles.row}>
              <span className={styles.cat}>{cat}</span>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.pct}>{pct}%</span>
              <span className={styles.amount}>
                ₹{Number(sum.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
