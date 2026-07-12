import Link from "next/link";
import { GitCompare } from "lucide-react";
import { getProductsForCompare, MAX_COMPARE } from "@/lib/queries/compare";
import { formatBDT } from "@/lib/utils/money";
import { StarRating } from "@/components/product/star-rating";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { CompareRemoveButton } from "@/components/compare/compare-remove-button";

export const metadata = { title: "Compare Products" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: raw } = await searchParams;
  const ids = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const products = await getProductsForCompare(ids);

  if (products.length < 2) {
    return (
      <div className="space-y-4 py-16 text-center" data-testid="compare-empty">
        <GitCompare className="mx-auto h-10 w-10 text-hairline-strong" />
        <h1 className="text-2xl font-bold">Nothing to compare yet</h1>
        <p className="text-muted">
          Pick at least 2 products (up to {MAX_COMPARE}) using the compare icon on
          product cards, then come back here.
        </p>
        <Link
          href="/products"
          className="inline-block rounded-md bg-accent px-6 py-2 font-medium text-white hover:bg-accent-strong"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // Union of spec keys across all products, in first-seen order.
  const specKeys: string[] = [];
  for (const p of products) {
    for (const s of p.specs) {
      if (!specKeys.includes(s.key)) specKeys.push(s.key);
    }
  }
  const specValue = (p: (typeof products)[number], key: string) =>
    p.specs.find((s) => s.key === key)?.value ?? "—";

  const colorName = (c: string) => c.split("|")[0]?.trim() || c;

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
        <GitCompare className="h-6 w-6 text-accent" /> Compare Products
      </h1>

      <div className="overflow-x-auto rounded-lg border border-hairline">
        {/* table-fixed + a colgroup keeps every product column an equal width;
            minWidth keeps columns readable and enables horizontal scroll when
            comparing 3-4 products on a narrow screen. */}
        <table
          className="w-full table-fixed border-collapse text-[13px] md:text-sm"
          style={{ minWidth: `${products.length * 130 + 80}px` }}
        >
          <colgroup>
            <col className="w-20 md:w-44" />
            {products.map((p) => (
              <col key={p.id} />
            ))}
          </colgroup>
          <tbody>
            {/* Product header */}
            <tr className="border-b border-hairline">
              <th className="sticky left-0 z-10 bg-surface-2 p-2 text-left align-top text-[11px] font-semibold uppercase text-muted md:p-3 md:text-xs">
                Product
              </th>
              {products.map((p) => (
                <td key={p.id} className="border-l border-hairline p-2 align-top md:p-3">
                  <div className="space-y-2">
                    <Link href={`/products/${p.slug}`} className="block">
                      <div className="grid aspect-square max-h-28 place-items-center rounded border border-hairline bg-surface p-2 md:max-h-40">
                        {p.images[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0].url}
                            alt={p.images[0].alt ?? p.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="meta-label">No image</span>
                        )}
                      </div>
                      <span className="mt-2 line-clamp-2 block font-semibold text-ink hover:text-accent">
                        {p.name}
                      </span>
                    </Link>
                    <CompareRemoveButton productId={p.id} />
                  </div>
                </td>
              ))}
            </tr>

            <Row label="Price">
              {products.map((p) => (
                <Cell key={p.id}>
                  <span className="text-base font-bold text-accent">{formatBDT(p.price)}</span>
                  {p.comparePrice && (
                    <span className="ml-1 text-xs text-muted line-through">
                      {formatBDT(p.comparePrice)}
                    </span>
                  )}
                </Cell>
              ))}
            </Row>

            <Row label="Brand">
              {products.map((p) => (
                <Cell key={p.id}>{p.brand?.name ?? "—"}</Cell>
              ))}
            </Row>

            <Row label="Category">
              {products.map((p) => (
                <Cell key={p.id}>{p.category.name}</Cell>
              ))}
            </Row>

            <Row label="Rating">
              {products.map((p) => (
                <Cell key={p.id}>
                  {p.ratingCount > 0 ? (
                    <StarRating value={p.ratingAvg} count={p.ratingCount} />
                  ) : (
                    <span className="text-muted">No reviews</span>
                  )}
                </Cell>
              ))}
            </Row>

            <Row label="Availability">
              {products.map((p) => (
                <Cell key={p.id}>
                  {p.stock > 0 ? (
                    <span className="font-medium text-green-600">In stock</span>
                  ) : (
                    <span className="font-medium text-red-600">Stock out</span>
                  )}
                </Cell>
              ))}
            </Row>

            <Row label="Warranty">
              {products.map((p) => (
                <Cell key={p.id}>{p.warranty ?? "—"}</Cell>
              ))}
            </Row>

            <Row label="Colours">
              {products.map((p) => (
                <Cell key={p.id}>
                  {p.colors.length ? p.colors.map(colorName).join(", ") : "—"}
                </Cell>
              ))}
            </Row>

            {specKeys.map((key) => (
              <Row key={key} label={key}>
                {products.map((p) => (
                  <Cell key={p.id}>{specValue(p, key)}</Cell>
                ))}
              </Row>
            ))}

            {/* Actions */}
            <tr>
              <th className="sticky left-0 z-10 bg-surface-2 p-2 text-left align-top text-[11px] font-semibold uppercase text-muted md:p-3 md:text-xs">
                Buy
              </th>
              {products.map((p) => (
                <td key={p.id} className="border-l border-t border-hairline p-2 align-top md:p-3">
                  <AddToCartButton productId={p.id} stock={p.stock} size="sm" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Attribute row with a sticky label column. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-hairline">
      <th className="sticky left-0 z-10 bg-surface-2 p-2 text-left align-top text-[11px] font-semibold uppercase text-muted md:p-3 md:text-xs">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-l border-hairline p-2 align-top text-ink [overflow-wrap:anywhere] md:p-3">{children}</td>
  );
}
