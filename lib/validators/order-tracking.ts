import { z } from "zod";

/**
 * Courier tracking details an admin attaches when shipping an order.
 * All fields optional, but a tracking URL — when given — must be a real http(s)
 * link so the "Track parcel" button never points somewhere broken.
 */
export const orderTrackingSchema = z.object({
  carrier: z.string().trim().max(60).optional(),
  number: z.string().trim().max(80).optional(),
  url: z
    .string()
    .trim()
    .max(500)
    .url("Enter a valid tracking link (https://…)")
    .refine((v) => /^https?:\/\//i.test(v), "Link must start with http:// or https://")
    .optional()
    .or(z.literal("")),
});

export type OrderTrackingInput = z.infer<typeof orderTrackingSchema>;

/** Common courier services in Bangladesh — used for the admin datalist. */
export const BD_COURIERS = [
  "Pathao Courier",
  "Steadfast Courier",
  "RedX",
  "Sundarban Courier",
  "eCourier",
  "Paperfly",
  "SA Paribahan",
  "Korotoa Courier",
  "Delivery Tiger",
] as const;
