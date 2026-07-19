import { describe, it, expect } from "vitest";
import { csvProductRowSchema } from "@/lib/validators/product-admin";

// Column labels mirror the "Add product" form.
const base = {
  Name: "Wireless Mouse Pro",
  Description: "Ergonomic wireless mouse",
  "Regular Price": "1590",
  "Sale Price": "",
  "Cost Price": "",
  Stock: "50",
  Category: "Mouse",
  Brand: "",
};

describe("csvProductRowSchema", () => {
  it("accepts a minimal valid row and coerces numbers", () => {
    const r = csvProductRowSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data["Regular Price"]).toBe(1590);
      expect(r.data.Stock).toBe(50);
      expect(r.data["Sale Price"]).toBeUndefined();
      expect(r.data["Cost Price"]).toBeUndefined();
      expect(r.data.Brand).toBeUndefined();
    }
  });

  it("accepts a Sale Price lower than the Regular Price", () => {
    const r = csvProductRowSchema.safeParse({ ...base, "Sale Price": "1290", "Cost Price": "900" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data["Sale Price"]).toBe(1290);
      expect(r.data["Cost Price"]).toBe(900);
    }
  });

  it("rejects a Sale Price that is not below the Regular Price", () => {
    expect(csvProductRowSchema.safeParse({ ...base, "Sale Price": "1590" }).success).toBe(false);
    expect(csvProductRowSchema.safeParse({ ...base, "Sale Price": "2000" }).success).toBe(false);
  });

  it("requires Name, Description, Regular Price, Stock and Category", () => {
    expect(csvProductRowSchema.safeParse({ ...base, Name: "" }).success).toBe(false);
    expect(csvProductRowSchema.safeParse({ ...base, "Regular Price": "" }).success).toBe(false);
    expect(csvProductRowSchema.safeParse({ ...base, Category: "" }).success).toBe(false);
  });

  it("rejects a negative Cost Price and a non-positive Regular Price", () => {
    expect(csvProductRowSchema.safeParse({ ...base, "Cost Price": "-5" }).success).toBe(false);
    expect(csvProductRowSchema.safeParse({ ...base, "Regular Price": "0" }).success).toBe(false);
  });
});
