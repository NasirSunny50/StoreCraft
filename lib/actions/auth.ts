"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/utils/password";
import { registerSchema, loginSchema } from "@/lib/validators/auth";
import { ADMIN_PORTAL_ROLES } from "@/lib/auth-guard";
import { mergeGuestCartIntoUser } from "@/lib/cart";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "An account with this email already exists.",
      fieldErrors: { email: ["Email already registered"] },
    };
  }

  const created = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  // Auto-login the new customer, then fold any guest cart into their account.
  await signIn("credentials", { email, password, redirect: false });
  await mergeGuestCartIntoUser(created.id);
  redirect("/");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  // Pre-check: gives a precise blocked message + the role for redirect target.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.isBlocked) {
    return { error: "Your account has been blocked. Please contact support." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  // Fold any guest cart into the now-authenticated account.
  if (user) await mergeGuestCartIntoUser(user.id);

  const dest =
    user && ADMIN_PORTAL_ROLES.includes(user.role) ? "/admin" : "/";
  redirect(dest);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
