import { z } from "zod";

export const placeOrderSchema = z.object({
  addressId: z.string().min(1, "Please select a delivery address"),
  paymentMethod: z.enum(["COD", "SSLCOMMERZ"]).default("COD"),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  couponCode: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
