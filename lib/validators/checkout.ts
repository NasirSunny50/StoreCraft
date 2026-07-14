import { z } from "zod";
import { addressSchema } from "@/lib/validators/address";

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

/**
 * Guest checkout: inline shipping details (reusing the address rules) plus an
 * optional email for order notifications, a note, and an optional coupon.
 * Guests are Cash-on-Delivery only, so no payment-method field.
 */
export const guestCheckoutSchema = addressSchema
  .omit({ isDefault: true })
  .extend({
    // Guests pick city + area from dropdowns — both are required.
    city: z.string().trim().min(1, "Please select a city"),
    area: z.string().trim().min(1, "Please select an area").max(80),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("").transform(() => undefined)),
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

export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
