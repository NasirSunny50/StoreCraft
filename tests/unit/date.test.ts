import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/utils/date";

describe("formatDate", () => {
  it("formats a Date as day-first '15 Jul 2026'", () => {
    // Local-time constructor avoids timezone shift (month is 0-indexed → 6 = July).
    expect(formatDate(new Date(2026, 6, 15))).toBe("15 Jul 2026");
  });

  it("formats a single-digit day without a leading zero", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("5 Jan 2026");
  });

  it("accepts an ISO date string", () => {
    expect(formatDate("2026-12-25")).toMatch(/25 Dec 2026/);
  });
});
