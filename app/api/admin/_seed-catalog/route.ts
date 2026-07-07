import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertCatalog } from "@/lib/catalog-seed";

/**
 * TEMPORARY one-time loader — populates the demo catalog (6 products/category).
 * Token-gated (server-side only). REMOVE this route after running it once.
 */
const SEED_TOKEN = "836f35f237c129ccb11975d7fc9990d76347ea0ef4e67e9c";

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== SEED_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await upsertCatalog(prisma);

  const cats = await prisma.category.findMany({
    include: {
      _count: { select: { products: { where: { isActive: true, isDeleted: false } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    ok: true,
    ...result,
    perCategory: cats.map((c) => ({ category: c.name, activeProducts: c._count.products })),
  });
}
