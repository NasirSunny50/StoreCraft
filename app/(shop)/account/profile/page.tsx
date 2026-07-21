import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata = { title: "Profile Information" };

export default async function ProfilePage() {
  const session = await requireAuth("/account/profile");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, email: true },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-ink md:text-2xl">Profile Information</h1>

      <div className="rounded-lg border border-hairline bg-surface p-4 md:p-6">
        <ProfileForm
          name={user?.name ?? ""}
          phone={user?.phone ?? ""}
          email={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
