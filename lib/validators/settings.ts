import { z } from "zod";

/** Delivery charge: a non-negative amount with up to 2 decimal places. */
export const shippingFeeSchema = z.object({
  shippingFee: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 60 or 60.00")
    .refine((v) => Number(v) <= 100000, "Amount is too large"),
});

export type ShippingFeeInput = z.infer<typeof shippingFeeSchema>;
