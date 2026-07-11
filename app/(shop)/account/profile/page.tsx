import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-full border border-hairline-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>
        <h1 className="text-xl font-bold text-ink md:text-2xl">Profile Information</h1>
      </div>

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
