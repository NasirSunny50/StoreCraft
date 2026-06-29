import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <section className="space-y-4 py-12 text-center">
      <h1 className="text-3xl font-bold" data-testid="forbidden-heading">
        403 — Access Denied
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        You don&apos;t have permission to view this page.
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        Back to home
      </Link>
    </section>
  );
}
