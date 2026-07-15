import Link from "next/link";
import type { Banner } from "@/lib/banners";

/**
 * One of the two small hero promo boxes on the right. Shows the admin-uploaded
 * banner image (optionally linked) when set, otherwise falls back to the
 * built-in gradient promo passed as children.
 */
export function SidePromo({
  banner,
  children,
}: {
  banner: Banner | null;
  children: React.ReactNode;
}) {
  const frame = "flex-1 overflow-hidden rounded border border-hairline min-h-[120px]";

  if (!banner) {
    return <div className={frame}>{children}</div>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" />;
  return (
    <div className={frame}>
      {banner.href ? (
        <Link href={banner.href} className="block h-full w-full">
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );
}
