import { describe, it, expect } from "vitest";
import { addressSchema } from "@/lib/validators/address";
import { placeOrderSchema } from "@/lib/validators/checkout";

const validAddress = {
  fullName: "Rahim Uddin",
  phone: "01711-223344",
  line1: "House 12, Road 5",
  city: "Dhaka",
  area: "Mirpur",
};

describe("addressSchema", () => {
  it("accepts a valid address", () => {
    expect(addressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("requires name, line1, city, area", () => {
    expect(addressSchema.safeParse({ ...validAddress, fullName: "" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validAddress, line1: "" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validAddress, city: "" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...validAddress, area: "" }).success).toBe(false);
  });

  it("rejects an invalid phone", () => {
    expect(addressSchema.safeParse({ ...validAddress, phone: "abc!" }).success).toBe(false);
  });

  it("treats blank line2 as undefined", () => {
    const r = addressSchema.safeParse({ ...validAddress, line2: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.line2).toBeUndefined();
  });
});

describe("placeOrderSchema", () => {
  it("requires an address id", () => {
    expect(placeOrderSchema.safeParse({ addressId: "" }).success).toBe(false);
  });

  it("defaults paymentMethod to COD", () => {
    const r = placeOrderSchema.safeParse({ addressId: "abc" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.paymentMethod).toBe("COD");
  });

  it("rejects non-COD payment methods", () => {
    expect(placeOrderSchema.safeParse({ addressId: "abc", paymentMethod: "CARD" }).success).toBe(false);
  });
});
