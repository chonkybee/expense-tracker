import React, { useState } from "react";
import { CATEGORIES } from "@/types";
import { useCreateExpense } from "@/hooks/useCreateExpense";
import styles from "./ExpenseForm.module.css";

interface ExpenseFormProps {
  onSuccess: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const { createExpense, submitting, submitError, clearError } = useCreateExpense();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errors.amount = "Enter a valid positive amount";
    if (!/^\d+(\.\d{1,2})?$/.test(amount))
      errors.amount = "Max 2 decimal places (e.g. 123.45)";
    if (!category) errors.category = "Select a category";
    if (!description.trim()) errors.description = "Description is required";
    if (!date) errors.date = "Date is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg("");
    if (!validate()) return;

    const result = await createExpense({ amount, category, description, date });
    if (result) {
      setSuccessMsg(`Expense of ₹${result.amount} added!`);
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(today());
      setFieldErrors({});
      onSuccess();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>New Expense</h2>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Amount (₹)</label>
          <input
            className={`${styles.input} ${fieldErrors.amount ? styles.inputError : ""}`}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setFieldErrors(p => ({ ...p, amount: "" })); }}
          />
          {fieldErrors.amount && <span className={styles.error}>{fieldErrors.amount}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Date</label>
          <input
            className={`${styles.input} ${fieldErrors.date ? styles.inputError : ""}`}
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setFieldErrors(p => ({ ...p, date: "" })); }}
          />
          {fieldErrors.date && <span className={styles.error}>{fieldErrors.date}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Category</label>
        <select
          className={`${styles.select} ${fieldErrors.category ? styles.inputError : ""}`}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setFieldErrors(p => ({ ...p, category: "" })); }}
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {fieldErrors.category && <span className={styles.error}>{fieldErrors.category}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Description</label>
        <input
          className={`${styles.input} ${fieldErrors.description ? styles.inputError : ""}`}
          type="text"
          placeholder="e.g. Lunch at work"
          maxLength={500}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setFieldErrors(p => ({ ...p, description: "" })); }}
        />
        {fieldErrors.description && <span className={styles.error}>{fieldErrors.description}</span>}
      </div>

      {submitError && (
        <div className={styles.submitError}>
          ⚠ {submitError}
        </div>
      )}
      {successMsg && (
        <div className={styles.successMsg}>
          ✓ {successMsg}
        </div>
      )}

      <button className={styles.button} type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Add Expense"}
      </button>
    </form>
  );
}
