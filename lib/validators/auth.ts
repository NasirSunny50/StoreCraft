import { z } from "zod";
import { normalizeBdPhone } from "@/lib/utils/phone";

/** A BD mobile number, transformed to the canonical 01XXXXXXXXX form. */
const phoneField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizeBdPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid Bangladeshi mobile number" });
      return z.NEVER;
    }
    return normalized;
  });

/** Optional email: blank/undefined → undefined; otherwise validated + lowercased. */
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    phone: phoneField,
    email: optionalEmail,
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password is too long"), // bcrypt truncates beyond 72 bytes
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Login by mobile number OR email. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your mobile number or email"),
  password: z.string().min(1, "Password is required"),
});

/** Profile edit — name and optional email. Phone is not editable here. */
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: optionalEmail,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
