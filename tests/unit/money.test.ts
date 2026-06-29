import { describe, it, expect } from "vitest";
import {
  add,
  subtract,
  multiply,
  clampNonNegative,
  formatBDT,
} from "@/lib/utils/money";

describe("money arithmetic (Decimal, no float errors)", () => {
  it("adds without float rounding error", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in JS floats; Decimal must be exact.
    expect(add("0.1", "0.2").toString()).toBe("0.3");
  });

  it("subtracts correctly", () => {
    expect(subtract("100.00", "30.50").toString()).toBe("69.5");
  });

  it("multiplies price by quantity", () => {
    expect(multiply("149900", 2).toString()).toBe("299800");
  });

  it("clamps negative values to zero", () => {
    expect(clampNonNegative("-50").toString()).toBe("0");
    expect(clampNonNegative("50").toString()).toBe("50");
  });

  it("formats BDT with thousands separators and 2 decimals", () => {
    expect(formatBDT("149900")).toBe("৳149,900.00");
    expect(formatBDT("5900.5")).toBe("৳5,900.50");
  });
});
