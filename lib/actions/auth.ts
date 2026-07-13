"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/utils/password";
import { registerSchema, loginSchema, profileSchema } from "@/lib/validators/auth";
import { ADMIN_PORTAL_ROLES, requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { findUserByIdentifier } from "@/lib/auth-lookup";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { safeCallbackUrl } from "@/lib/utils/safe-redirect";
import {
  getClientIp,
  isLoginRateLimited,
  recordLoginFailure,
  clearLoginFailures,
  LOGIN_RATE_LIMIT_MESSAGE,
} from "@/lib/security/rate-limit";

export type AuthFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, phone, email, password } = parsed.data;

  // Phone is the login identifier — it must be unique.
  const phoneTaken = await prisma.user.findUnique({ where: { phone } });
  if (phoneTaken) {
    return {
      error: "An account with this mobile number already exists.",
      fieldErrors: { phone: ["Mobile number already registered"] },
    };
  }
  // Email is optional, but when given it must be unique too.
  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return {
        error: "An account with this email already exists.",
        fieldErrors: { email: ["Email already registered"] },
      };
    }
  }

  const created = await prisma.user.create({
    data: {
      name,
      phone,
      email: email ?? null,
      password: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  // Auto-login the new customer (by phone), then fold any guest cart in.
  await signIn("credentials", { identifier: phone, password, redirect: false });
  await mergeGuestCartIntoUser(created.id);
  redirect(safeCallbackUrl(formData.get("callbackUrl")) ?? "/");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { identifier, password } = parsed.data;

  // Brute-force throttle: block this IP once it has burned through too many
  // failed attempts inside the window.
  const ip = await getClientIp();
  if (await isLoginRateLimited(ip)) {
    return { error: LOGIN_RATE_LIMIT_MESSAGE };
  }

  // Pre-check: gives a precise blocked message + the role for redirect target.
  const user = await findUserByIdentifier(identifier);
  if (user?.isBlocked) {
    return { error: "Your account has been blocked. Please contact support." };
  }

  try {
    await signIn("credentials", { identifier, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      await recordLoginFailure(ip);
      return { error: "Invalid mobile number/email or password." };
    }
    throw error;
  }

  // Successful auth — reset this IP's failure history.
  await clearLoginFailures(ip);

  // Fold any guest cart into the now-authenticated account.
  if (user) await mergeGuestCartIntoUser(user.id);

  // Prefer where the user was headed (e.g. /checkout); else role-based default.
  const dest =
    safeCallbackUrl(formData.get("callbackUrl")) ??
    (user && ADMIN_PORTAL_ROLES.includes(user.role) ? "/admin" : "/");
  redirect(dest);
}

/** Update the signed-in user's profile (name + optional email). Phone is fixed. */
export async function updateProfileAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const session = await requireAuth();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email } = parsed.data;

  // If an email is set, it must not belong to another account.
  if (email) {
    const other = await prisma.user.findUnique({ where: { email } });
    if (other && other.id !== session.user.id) {
      return {
        error: "That email is already used by another account.",
        fieldErrors: { email: ["Email already in use"] },
      };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email: email ?? null },
  });

  revalidatePath("/account/profile");
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
