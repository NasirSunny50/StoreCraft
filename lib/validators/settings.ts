import { z } from "zod";

/** A delivery charge: non-negative, up to 2 decimal places, not absurdly large. */
const feeField = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 60 or 60.00")
  .refine((v) => Number(v) <= 100000, "Amount is too large");

export const deliveryFeesSchema = z.object({
  insideDhaka: feeField,
  outsideDhaka: feeField,
});

export type DeliveryFeesInput = z.infer<typeof deliveryFeesSchema>;
