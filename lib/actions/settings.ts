"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { setShippingFee } from "@/lib/settings";
import { shippingFeeSchema } from "@/lib/validators/settings";

export type SettingsFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/** ADMIN: update the delivery charge used at checkout / order placement. */
export async function updateShippingFeeAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = shippingFeeSchema.safeParse({
    shippingFee: formData.get("shippingFee"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await setShippingFee(parsed.data.shippingFee);

  // New orders (and the live checkout total) pick up the change immediately.
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true };
}
