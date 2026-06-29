import { cn } from "@/lib/utils/cn";

/**
 * Signature element. Frames a product on a neutral pad with hairline corner
 * registration ticks (camera-viewfinder / technical-drawing marks). When placed
 * inside a `group`, the ticks snap to the accent colour on hover.
 *
 * `size` controls tick length so the motif scales card → hero → detail.
 */
export function RegistrationFrame({
  children,
  className,
  size = "md",
  inset = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  inset?: "sm" | "md" | "lg";
}) {
  const tick =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const pos =
    inset === "lg" ? "4" : inset === "sm" ? "1.5" : "2.5";
  const base =
    "pointer-events-none absolute border-hairline-strong transition-colors duration-300 group-hover:border-accent";

  return (
    <div className={cn("relative", className)}>
      {children}
      <span className={cn(base, tick, "border-l border-t")} style={cornerStyle(pos, "tl")} />
      <span className={cn(base, tick, "border-r border-t")} style={cornerStyle(pos, "tr")} />
      <span className={cn(base, tick, "border-l border-b")} style={cornerStyle(pos, "bl")} />
      <span className={cn(base, tick, "border-r border-b")} style={cornerStyle(pos, "br")} />
    </div>
  );
}

function cornerStyle(pos: string, corner: "tl" | "tr" | "bl" | "br") {
  const v = `calc(var(--spacing) * ${pos})`;
  const style: React.CSSProperties = {};
  if (corner === "tl" || corner === "tr") style.top = v;
  if (corner === "bl" || corner === "br") style.bottom = v;
  if (corner === "tl" || corner === "bl") style.left = v;
  if (corner === "tr" || corner === "br") style.right = v;
  return style;
}
