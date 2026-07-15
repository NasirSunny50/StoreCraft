import Link from "next/link";
import type { Banner } from "@/lib/banners";

/**
 * One of the two small hero promo boxes on the right. Shows the admin-uploaded
 * banner image (optionally linked) when set, otherwise falls back to the
 * built-in gradient promo passed as children.
 *
 * The frame owns the size (a fixed slice of the hero row); the image is taken
 * out of flow (absolute + object-cover) so a large upload is scaled down to fit
 * this portion instead of stretching the box and shrinking the hero slider.
 */
export function SidePromo({
  banner,
  children,
}: {
  banner: Banner | null;
  children: React.ReactNode;
}) {
  const frame =
    "relative flex-1 overflow-hidden rounded border border-hairline min-h-[110px] lg:min-h-0";

  if (!banner) {
    return <div className={frame}>{children}</div>;
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
  );
  return (
    <div className={frame}>
      {banner.href ? (
        <Link href={banner.href} className="absolute inset-0">
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );
}
