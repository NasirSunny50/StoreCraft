"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/utils/slug";
import { parseCsv } from "@/lib/csv";
import {
  productFormSchema,
  csvProductRowSchema,
  type ProductFormInput,
} from "@/lib/validators/product-admin";

export type ProductActionResult =
  | { ok: true; id: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> };

async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "product";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.product.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

function revalidateProduct(slug?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function createProduct(
  input: ProductFormInput,
): Promise<ProductActionResult> {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const slug = await uniqueProductSlug(d.slug || d.name);

  const product = await prisma.product.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      price: new Prisma.Decimal(d.price),
      comparePrice: d.comparePrice ? new Prisma.Decimal(d.comparePrice) : null,
      costPrice: new Prisma.Decimal(d.costPrice ?? 0),
      stock: d.stock,
      lowStockAt: d.lowStockAt,
      categoryId: d.categoryId,
      brandId: d.brandId ?? null,
      isActive: d.isActive,
      isFeatured: d.isFeatured,
      warranty: d.warranty ?? null,
      colors: d.colors,
      specs: { create: d.specs },
      images: { create: d.images.map((url, i) => ({ url, position: i })) },
    },
  });

  const initialCost = d.costPrice ?? 0;
  if (d.stock > 0 || initialCost > 0) {
    await prisma.stockLog.create({
      data: {
        productId: product.id,
        change: d.stock,
        reason: "INITIAL",
        unitCost: initialCost > 0 ? new Prisma.Decimal(initialCost) : null,
        costAfter: initialCost > 0 ? new Prisma.Decimal(initialCost) : null,
      },
    });
  }

  revalidateProduct(slug);
  return { ok: true, id: product.id };
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
): Promise<ProductActionResult> {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const slug = await uniqueProductSlug(d.slug || d.name, id);
  const newCost = new Prisma.Decimal(d.costPrice ?? 0);

  await prisma.$transaction(async (tx) => {
    // Track a manual cost change so it shows up in the product's cost history.
    const before = await tx.product.findUnique({ where: { id }, select: { costPrice: true } });
    if (before && !before.costPrice.equals(newCost)) {
      await tx.stockLog.create({
        data: { productId: id, change: 0, reason: "COST_EDIT", unitCost: newCost, costAfter: newCost },
      });
    }

    await tx.product.update({
      where: { id },
      data: {
        name: d.name,
        slug,
        description: d.description,
        price: new Prisma.Decimal(d.price),
        comparePrice: d.comparePrice ? new Prisma.Decimal(d.comparePrice) : null,
        costPrice: newCost,
        stock: d.stock,
        lowStockAt: d.lowStockAt,
        categoryId: d.categoryId,
        brandId: d.brandId ?? null,
        isActive: d.isActive,
        isFeatured: d.isFeatured,
        warranty: d.warranty ?? null,
        colors: d.colors,
      },
    });
    await tx.productSpec.deleteMany({ where: { productId: id } });
    if (d.specs.length > 0) {
      await tx.productSpec.createMany({
        data: d.specs.map((s) => ({ productId: id, key: s.key, value: s.value })),
      });
    }
    await tx.productImage.deleteMany({ where: { productId: id } });
    if (d.images.length > 0) {
      await tx.productImage.createMany({
        data: d.images.map((url, i) => ({ productId: id, url, position: i })),
      });
    }
  });

  revalidateProduct(slug);
  return { ok: true, id };
}

export async function softDeleteProduct(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  });
  revalidateProduct();
  return { ok: true };
}

export async function restoreProduct(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { isDeleted: false, isActive: true },
  });
  revalidateProduct();
  return { ok: true };
}

export type BulkUploadResult = {
  ok: boolean;
  error?: string;
  created: number;
  total: number;
  errors: { row: number; message: string }[];
};

export async function bulkUploadProducts(csvText: string): Promise<BulkUploadResult> {
  await requireAdmin();
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { ok: false, error: "No data rows found.", created: 0, total: 0, errors: [] };
  }

  const [cats, brands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true } }),
  ]);
  const catBy = new Map<string, string>();
  cats.forEach((c) => {
    catBy.set(c.name.toLowerCase(), c.id);
    catBy.set(c.slug, c.id);
  });
  const brandBy = new Map<string, string>();
  brands.forEach((b) => {
    brandBy.set(b.name.toLowerCase(), b.id);
    brandBy.set(b.slug, b.id);
  });

  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNo = i + 2; // +1 header, +1 to 1-index
    const parsed = csvProductRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      errors.push({ row: rowNo, message: `${first?.path.join(".")}: ${first?.message}` });
      continue;
    }
    const d = parsed.data;
    const categoryId = catBy.get(d.category.toLowerCase()) ?? catBy.get(slugify(d.category));
    if (!categoryId) {
      errors.push({ row: rowNo, message: `Unknown category "${d.category}"` });
      continue;
    }
    let brandId: string | undefined;
    if (d.brand) {
      brandId = brandBy.get(d.brand.toLowerCase()) ?? brandBy.get(slugify(d.brand));
      if (!brandId) {
        errors.push({ row: rowNo, message: `Unknown brand "${d.brand}"` });
        continue;
      }
    }
    const slug = await uniqueProductSlug(d.name);
    await prisma.product.create({
      data: {
        name: d.name,
        slug,
        description: d.description,
        price: new Prisma.Decimal(d.price),
        comparePrice: d.comparePrice ? new Prisma.Decimal(d.comparePrice) : null,
        stock: d.stock,
        categoryId,
        brandId: brandId ?? null,
      },
    });
    created += 1;
  }

  revalidateProduct();
  return { ok: true, created, total: rows.length, errors };
}
