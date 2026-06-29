// Re-mounts on navigation → gives a subtle page-transition fade.
// (Disabled automatically under prefers-reduced-motion via globals.css.)
export default function ShopTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-fade">{children}</div>;
}
