import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBDT } from "@/lib/utils/money";

/**
 * Lightweight product autocomplete for the header search. Matches active
 * products by name (case-insensitive), returning a handful ranked by
 * popularity for the live suggestions dropdown.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      name: { contains: q, mode: "insensitive" },
    },
    orderBy: [{ ratingCount: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
      category: { select: { name: true } },
    },
  });

  const suggestions = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.images[0]?.url ?? null,
    priceFormatted: formatBDT(p.price),
    comparePriceFormatted: p.comparePrice ? formatBDT(p.comparePrice) : null,
    categoryName: p.category.name,
  }));

  return NextResponse.json({ suggestions });
}
