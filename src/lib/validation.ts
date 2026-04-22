import Decimal from "decimal.js";
import { CATEGORIES } from "@/types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAmount(raw: unknown): ValidationResult {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return { valid: false, error: "amount is required" };
  }
  const str = String(raw).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    return {
      valid: false,
      error: "amount must be a positive number with at most 2 decimal places",
    };
  }
  try {
    const d = new Decimal(str);
    if (d.lte(0)) return { valid: false, error: "amount must be greater than 0" };
    if (d.gt(new Decimal("999999999.99")))
      return { valid: false, error: "amount is unrealistically large" };
  } catch {
    return { valid: false, error: "amount is not a valid number" };
  }
  return { valid: true };
}

export function validateCategory(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "category is required" };
  }
  if (!(CATEGORIES as readonly string[]).includes(raw.trim())) {
    return { valid: false, error: `category must be one of: ${CATEGORIES.join(", ")}` };
  }
  return { valid: true };
}

export function validateDate(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "date is required" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return { valid: false, error: "date must be in YYYY-MM-DD format" };
  }
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) return { valid: false, error: "date is invalid" };
  return { valid: true };
}

export function validateDescription(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "description is required" };
  }
  if (raw.trim().length > 500) {
    return { valid: false, error: "description must be 500 characters or fewer" };
  }
  return { valid: true };
}

export function validateIdempotencyKey(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "idempotency_key is required" };
  }
  if (raw.trim().length > 128) {
    return { valid: false, error: "idempotency_key must be 128 characters or fewer" };
  }
  return { valid: true };
}
