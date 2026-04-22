import React, { useState } from "react";
import Head from "next/head";
import { CATEGORIES } from "@/types";
import { useExpenses } from "@/hooks/useExpenses";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import CategorySummary from "@/components/CategorySummary";
import styles from "./index.module.css";

export default function Home() {
  const [filterCategory, setFilterCategory] = useState("");
  const [sort, setSort] = useState<"date_desc" | "date_asc">("date_desc");

  const { expenses, total, loading, error, refetch } = useExpenses({
    category: filterCategory || undefined,
    sort,
  });

  return (
    <>
      <Head>
        <title>Spendwise — Personal Expense Tracker</title>
        <meta name="description" content="Track your personal expenses with clarity." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>₹</text></svg>" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>₹</span>
            <span>Spendwise</span>
          </div>
          <p className={styles.tagline}>Know where your money goes</p>
        </header>

        <main className={styles.main}>
          <section className={styles.formSection}>
            <ExpenseForm onSuccess={refetch} />
          </section>

          <section className={styles.listSection}>
            <div className={styles.controls}>
              <div className={styles.control}>
                <label className={styles.controlLabel}>Filter</label>
                <select
                  className={styles.controlSelect}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.control}>
                <label className={styles.controlLabel}>Sort</label>
                <select
                  className={styles.controlSelect}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "date_desc" | "date_asc")}
                >
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                </select>
              </div>
            </div>

            <div className={styles.listCard}>
              <ExpenseList
                expenses={expenses}
                total={total}
                loading={loading}
                error={error}
              />
            </div>

            {!loading && !error && (
              <CategorySummary expenses={expenses} />
            )}
          </section>
        </main>

        <footer className={styles.footer}>
          Built with Next.js · Data persisted in SQLite
        </footer>
      </div>
    </>
  );
}
