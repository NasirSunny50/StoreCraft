import { cn } from "@/lib/utils/cn";

/**
 * Renders the store's brand mark: the uploaded logo image when set, otherwise a
 * two-tone wordmark built from the shop name (first word accent, rest in the
 * variant colour). Pure/presentational so it works in both server and client
 * trees — parents pass shopName/logoUrl from getBranding().
 */
export function BrandLogo({
  shopName,
  logoUrl,
  variant = "light",
  className,
  imgClassName,
}: {
  shopName: string;
  logoUrl?: string;
  /** "light" bg → dark text; "dark" bg (navbar/footer) → white text. */
  variant?: "light" | "dark";
  className?: string;
  imgClassName?: string;
}) {
  const [first, ...rest] = shopName.trim().split(/\s+/);
  const tail = rest.join(" ");
  const restColor = variant === "dark" ? "text-white" : "text-ink";

  return (
    <span className="flex items-center gap-2">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={shopName}
          className={cn("h-8 w-auto max-w-[120px] object-contain", imgClassName)}
        />
      )}
      <span className={cn("flex items-baseline gap-1 font-extrabold tracking-tight", className)}>
        <span className="text-accent">{first}</span>
        {tail && <span className={restColor}>{tail}</span>}
      </span>
    </span>
  );
}
