import { MapPin, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { getUserAddresses } from "@/lib/queries/address";
import { AddressList } from "@/components/account/address-list";
import { AddressForm } from "@/components/checkout/address-form";
import type { AddressView } from "@/components/checkout/checkout-form";

export const metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const session = await requireAuth();
  const addresses = await getUserAddresses(session.user.id);
  const views: AddressView[] = addresses.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    area: a.area,
    postcode: a.postcode,
    isDefault: a.isDefault,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink md:text-2xl">
          <MapPin className="h-6 w-6 text-accent" /> My Addresses
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your delivery addresses. Your default is used automatically at checkout.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <AddressList addresses={views} />
        <div className="rounded-xl border border-hairline bg-surface p-4 shadow-sm md:p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
            <Plus className="h-4 w-4 text-accent" /> Add New Address
          </h2>
          <AddressForm defaultFullName={session.user.name ?? undefined} />
        </div>
      </div>
    </div>
  );
}
