import {
  validateAmount,
  validateCategory,
  validateDate,
  validateDescription,
  validateIdempotencyKey,
} from "@/lib/validation";

describe("validateAmount", () => {
  it("accepts valid amounts", () => {
    expect(validateAmount("100").valid).toBe(true);
    expect(validateAmount("99.99").valid).toBe(true);
    expect(validateAmount("0.01").valid).toBe(true);
    expect(validateAmount("1000000").valid).toBe(true);
  });

  it("rejects zero", () => {
    expect(validateAmount("0").valid).toBe(false);
    expect(validateAmount("0.00").valid).toBe(false);
  });

  it("rejects negative amounts", () => {
    expect(validateAmount("-1").valid).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    expect(validateAmount("1.234").valid).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(validateAmount("abc").valid).toBe(false);
    expect(validateAmount("").valid).toBe(false);
  });

  it("rejects unrealistically large amounts", () => {
    expect(validateAmount("9999999999").valid).toBe(false);
  });
});

describe("validateCategory", () => {
  it("accepts valid categories", () => {
    expect(validateCategory("Food & Dining").valid).toBe(true);
    expect(validateCategory("Transport").valid).toBe(true);
    expect(validateCategory("Other").valid).toBe(true);
  });

  it("rejects unknown categories", () => {
    expect(validateCategory("Gambling").valid).toBe(false);
    expect(validateCategory("").valid).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(validateCategory(null).valid).toBe(false);
    expect(validateCategory(42).valid).toBe(false);
  });
});

describe("validateDate", () => {
  it("accepts valid YYYY-MM-DD dates", () => {
    expect(validateDate("2024-01-15").valid).toBe(true);
    expect(validateDate("2000-12-31").valid).toBe(true);
  });

  it("rejects wrong formats", () => {
    expect(validateDate("15/01/2024").valid).toBe(false);
    expect(validateDate("Jan 15 2024").valid).toBe(false);
    expect(validateDate("2024-1-5").valid).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(validateDate("2024-13-01").valid).toBe(false);
    expect(validateDate("").valid).toBe(false);
  });
});

describe("validateDescription", () => {
  it("accepts normal descriptions", () => {
    expect(validateDescription("Lunch at work").valid).toBe(true);
    expect(validateDescription("a").valid).toBe(true);
  });

  it("rejects empty or whitespace-only", () => {
    expect(validateDescription("").valid).toBe(false);
    expect(validateDescription("   ").valid).toBe(false);
  });

  it("rejects descriptions over 500 chars", () => {
    expect(validateDescription("x".repeat(501)).valid).toBe(false);
    expect(validateDescription("x".repeat(500)).valid).toBe(true);
  });
});

describe("validateIdempotencyKey", () => {
  it("accepts a UUID", () => {
    expect(validateIdempotencyKey("550e8400-e29b-41d4-a716-446655440000").valid).toBe(true);
  });

  it("rejects empty key", () => {
    expect(validateIdempotencyKey("").valid).toBe(false);
  });

  it("rejects keys over 128 chars", () => {
    expect(validateIdempotencyKey("a".repeat(129)).valid).toBe(false);
    expect(validateIdempotencyKey("a".repeat(128)).valid).toBe(true);
  });
});
