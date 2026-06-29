import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Enter a valid phone number"),
  line1: z.string().trim().min(3, "Address is required").max(200),
  line2: optionalText(200),
  city: z.string().trim().min(2, "City is required").max(80),
  area: optionalText(80),
  postcode: optionalText(12),
  isDefault: z.coerce.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
