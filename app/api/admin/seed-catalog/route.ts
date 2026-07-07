import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertCatalog, CATALOG_PRODUCTS } from "@/lib/catalog-seed";

/**
 * TEMPORARY one-time loader — populates the demo catalog (6 products/category).
 * Token-gated (server-side only). REMOVE this route after running it once.
 */
const SEED_TOKEN = "836f35f237c129ccb11975d7fc9990d76347ea0ef4e67e9c";

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s_-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const CATALOG_SLUGS = new Set(CATALOG_PRODUCTS.map((p) => slugify(p.name)));
const CATALOG_CATEGORIES = [...new Set(CATALOG_PRODUCTS.map((p) => p.category))] as string[];

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== SEED_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optional: deactivate named extra products (?deactivate=slug1,slug2).
  const toDeactivate = (url.searchParams.get("deactivate") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (toDeactivate.length) {
    await prisma.product.updateMany({
      where: { slug: { in: toDeactivate } },
      data: { isActive: false },
    });
  }

  const result = await upsertCatalog(prisma);

  const cats = await prisma.category.findMany({
    include: {
      products: { where: { isActive: true, isDeleted: false }, select: { name: true, slug: true } },
    },
    orderBy: { name: "asc" },
  });

  const extras = cats
    .filter((c) => CATALOG_CATEGORIES.includes(c.name))
    .flatMap((c) => c.products.filter((p) => !CATALOG_SLUGS.has(p.slug)).map((p) => ({ category: c.name, ...p })));

  return NextResponse.json({
    ok: true,
    ...result,
    deactivated: toDeactivate,
    perCategory: cats.map((c) => ({ category: c.name, activeProducts: c.products.length })),
    extras,
  });
}
