"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { setDeliveryFees } from "@/lib/settings";
import { deliveryFeesSchema } from "@/lib/validators/settings";

export type SettingsFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/** ADMIN: update the Inside/Outside Dhaka delivery charges. */
export async function updateDeliveryFeesAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = deliveryFeesSchema.safeParse({
    insideDhaka: formData.get("insideDhaka"),
    outsideDhaka: formData.get("outsideDhaka"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await setDeliveryFees(parsed.data);

  // New orders (and the live checkout total) pick up the change immediately.
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true };
}
