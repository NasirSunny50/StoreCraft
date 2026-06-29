import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

(async () => {
  const users = await p.user.count();
  const cats = await p.category.count();
  const brands = await p.brand.count();
  const products = await p.product.count();
  const specs = await p.productSpec.count();
  const images = await p.productImage.count();
  const admin = await p.user.findUnique({
    where: { email: "admin@storecraft.test" },
    select: { role: true, password: true },
  });
  const outOfStock = await p.product.count({ where: { stock: 0 } });
  console.log({
    users,
    cats,
    brands,
    products,
    specs,
    images,
    outOfStock,
    adminRole: admin?.role,
    passwordHashed: admin?.password.startsWith("$2") ?? false,
  });
  await p.$disconnect();
})();
