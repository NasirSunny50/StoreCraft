import { z } from "zod";

export const placeOrderSchema = z.object({
  addressId: z.string().min(1, "Please select a delivery address"),
  paymentMethod: z.literal("COD").default("COD"),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
