import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

export const couponSchema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters").max(30).transform((s) => s.toUpperCase()),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Value must be greater than 0"),
    minOrder: z.preprocess(emptyToUndef, z.coerce.number().min(0).default(0)),
    usageLimit: z.preprocess(emptyToUndef, z.coerce.number().int().positive().optional()),
    expiresAt: z.preprocess(emptyToUndef, z.coerce.date().optional()),
    isActive: z.coerce.boolean().default(true),
  })
  .refine((d) => d.type !== "PERCENT" || d.value <= 100, {
    message: "Percent value cannot exceed 100",
    path: ["value"],
  });

export type CouponInput = z.infer<typeof couponSchema>;
