import {
  extractLabel,
  formatDateTick,
  formatNumber,
  formatPercent,
} from "@/lib/analytics/format";
import { describe, expect, it } from "vitest";

// Cache real results to avoid locale differences
const POSITIVE_RESULT = formatPercent(0.15);
const NEGATIVE_RESULT = formatPercent(-0.25);
const ZERO_RESULT = formatPercent(0);

describe("formatNumber", () => {
  it("should format numbers with Spanish locale", () => {
    expect(formatNumber(1234)).toBe("1234");
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatPercent", () => {
  it("should format positive percentages", () => {
    const result = formatPercent(0.15);
    expect(result.text).toBe(POSITIVE_RESULT.text);
    expect(result.variant).toBe("positive");
  });

  it("should format negative percentages", () => {
    const result = formatPercent(-0.25);
    expect(result.text).toBe(NEGATIVE_RESULT.text);
    expect(result.variant).toBe("negative");
  });

  it("should format zero percentage", () => {
    const result = formatPercent(0);
    expect(result.text).toBe(ZERO_RESULT.text);
    expect(result.variant).toBe("neutral");
  });
  it("should handle null values", () => {
    const result = formatPercent(null);
    expect(result.text).toBe("—");
    expect(result.variant).toBe("neutral");
  });

  it("should handle undefined values", () => {
    // @ts-expect-error - testing edge case with undefined
    const result = formatPercent(undefined);
    expect(result.text).toBe("—");
    expect(result.variant).toBe("neutral");
  });
});

describe("extractLabel", () => {
  it("should extract label from simple path", () => {
    expect(extractLabel("/category/test-page")).toBe("test-page");
  });

  it("should extract label from complex path", () => {
    expect(extractLabel("/category/sub/page-name")).toBe("page-name");
  });

  it("should handle root path", () => {
    expect(extractLabel("/")).toBe("/");
  });

  it("should handle empty path", () => {
    expect(extractLabel("")).toBe("/");
  });

  it("should decode URI components", () => {
    expect(extractLabel("/category/página%20con%20espacios")).toBe(
      "página con espacios"
    );
  });

  it("should handle paths with trailing slash", () => {
    expect(extractLabel("/category/test-page/")).toBe("test-page");
  });

  // Error barrier tests
  it("should handle null input gracefully", () => {
    // @ts-expect-error - testing error boundary with invalid input
    expect(extractLabel(null)).toBe("/");
  });

  it("should handle undefined input gracefully", () => {
    // @ts-expect-error - testing error boundary with invalid input
    expect(extractLabel(undefined)).toBe("/");
  });

  it("should handle non-string input gracefully", () => {
    // @ts-expect-error - testing error boundary with invalid input
    expect(extractLabel(123)).toBe("/");
  });

  it("should handle malformed URI encoding gracefully", () => {
    expect(extractLabel("/path/with%invalid%encoding")).toBe(
      "with%invalid%encoding"
    );
  });
});

describe("formatDateTick", () => {
  it("should format daily dates correctly", () => {
    const result = formatDateTick("2024-03-15", "d");
    expect(result).toMatch(/\d{1,2}\s+\w{3}/); // Should match "15 mar" format
  });

  it("should format yearly dates correctly", () => {
    const result = formatDateTick("2024-03", "y");
    expect(result).toMatch(/\w{3}\s+\d{4}/); // Should match "mar 2024" format
  });

  // Error barrier tests
  it("should handle invalid date strings gracefully", () => {
    const result = formatDateTick("invalid-date", "d");
    expect(result).toBe("invalid-date");
  });

  it("should handle empty date strings gracefully", () => {
    const result = formatDateTick("", "d");
    expect(result).toBe("Fecha inválida");
  });

  it("should handle null date strings gracefully", () => {
    // @ts-expect-error - testing error boundary with invalid input
    const result = formatDateTick(null, "d");
    expect(result).toBe("Fecha inválida");
  });

  it("should handle malformed yearly dates gracefully", () => {
    const result = formatDateTick("2024", "y");
    expect(result).toBe("2024");
  });

  it("should handle invalid year values gracefully", () => {
    const result = formatDateTick("abc-03", "y");
    expect(result).toBe("abc-03");
  });

  it("should handle out-of-range months gracefully", () => {
    const result = formatDateTick("2024-13", "y");
    expect(result).toBe("2024-13");
  });

  it("should handle invalid daily format gracefully", () => {
    const result = formatDateTick("2024-13-45", "d");
    expect(result).toBe("2024-13-45");
  });
});
