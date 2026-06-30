"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/utils/slug";

export type ActionResult = { ok: boolean; error?: string };

function clean(name: unknown): string {
  return String(name ?? "").trim();
}

// ---------- Categories ----------
export async function createCategory(name: string): Promise<ActionResult> {
  await requireAdmin();
  const n = clean(name);
  if (n.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  const slug = slugify(n);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: n }, { slug }] },
  });
  if (existing) return { ok: false, error: "A category with this name already exists." };
  await prisma.category.create({ data: { name: n, slug } });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<ActionResult> {
  await requireAdmin();
  const n = clean(name);
  if (n.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  await prisma.category.update({ where: { id }, data: { name: n, slug: slugify(n) } });
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, error: `Category has ${count} product(s). Reassign them first.` };
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { ok: true };
}

// ---------- Brands ----------
export async function createBrand(name: string): Promise<ActionResult> {
  await requireAdmin();
  const n = clean(name);
  if (n.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  const slug = slugify(n);
  const existing = await prisma.brand.findFirst({
    where: { OR: [{ name: n }, { slug }] },
  });
  if (existing) return { ok: false, error: "A brand with this name already exists." };
  await prisma.brand.create({ data: { name: n, slug } });
  revalidatePath("/admin/brands");
  return { ok: true };
}

export async function renameBrand(id: string, name: string): Promise<ActionResult> {
  await requireAdmin();
  const n = clean(name);
  if (n.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
  await prisma.brand.update({ where: { id }, data: { name: n, slug: slugify(n) } });
  revalidatePath("/admin/brands");
  return { ok: true };
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) return { ok: false, error: `Brand has ${count} product(s). Reassign them first.` };
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
  return { ok: true };
}
