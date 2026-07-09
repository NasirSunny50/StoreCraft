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
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Addresses</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <AddressList addresses={views} />
        <div className="rounded border border-hairline bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold">Add New Address</h2>
          <AddressForm defaultFullName={session.user.name ?? undefined} />
        </div>
      </div>
    </div>
  );
}
