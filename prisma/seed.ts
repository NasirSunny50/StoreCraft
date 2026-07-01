import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function seedUsers() {
  const users: Array<{
    name: string;
    email: string;
    password: string;
    role: Role;
    isBlocked?: boolean;
  }> = [
    { name: "Site Admin", email: "admin@storecraft.test", password: "Admin@12345", role: "ADMIN" },
    { name: "Store Staff", email: "staff@storecraft.test", password: "Staff@12345", role: "STAFF" },
    { name: "Test Customer", email: "customer@storecraft.test", password: "Customer@12345", role: "CUSTOMER" },
    { name: "Blocked Customer", email: "blocked@storecraft.test", password: "Blocked@12345", role: "CUSTOMER", isBlocked: true },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isBlocked: u.isBlocked ?? false },
      create: {
        name: u.name,
        email: u.email,
        password: await hash(u.password),
        role: u.role,
        isBlocked: u.isBlocked ?? false,
      },
    });
  }
  console.log(`✓ Seeded ${users.length} users`);
}

async function seedCatalog() {
  // --- Categories (with a small tree) ---
  const categoryNames = [
    "Laptops",
    "Smartphones",
    "Audio",
    "Accessories",
  ];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categories[name] = cat.id;
  }

  // --- Brands ---
  const brandNames = ["Apple", "Samsung", "Sony", "Dell", "Anker"];
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    brands[name] = brand.id;
  }

  // --- Products ---
  const products = [
    {
      name: "MacBook Air M3 13-inch",
      category: "Laptops",
      brand: "Apple",
      price: 149900,
      comparePrice: 159900,
      stock: 12,
      isFeatured: true,
      description: "Apple M3 chip, 8-core CPU, 16GB RAM, 256GB SSD. Featherlight and fast.",
      specs: { Chip: "Apple M3", RAM: "16GB", Storage: "256GB SSD", Display: "13.6-inch Liquid Retina" },
    },
    {
      name: "Dell XPS 13 Plus",
      category: "Laptops",
      brand: "Dell",
      price: 139900,
      stock: 7,
      isFeatured: true,
      description: "Intel Core Ultra 7, 16GB RAM, 512GB SSD, 13.4-inch OLED.",
      specs: { CPU: "Intel Core Ultra 7", RAM: "16GB", Storage: "512GB SSD", Display: "13.4-inch OLED" },
    },
    {
      name: "iPhone 15 Pro",
      category: "Smartphones",
      brand: "Apple",
      price: 134900,
      comparePrice: 139900,
      stock: 20,
      isFeatured: true,
      warranty: "1 Year Apple Warranty",
      colors: ["Natural Titanium", "Blue Titanium", "Black Titanium"],
      description: "A17 Pro chip, titanium design, 48MP main camera.",
      specs: { Chip: "A17 Pro", Storage: "128GB", Display: "6.1-inch Super Retina XDR", Camera: "48MP" },
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      category: "Smartphones",
      brand: "Samsung",
      price: 144900,
      stock: 0, // out of stock — tests "Add to cart" disabled in Phase 2
      description: "Snapdragon 8 Gen 3, 200MP camera, built-in S Pen.",
      specs: { Chip: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB", Camera: "200MP" },
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      category: "Audio",
      brand: "Sony",
      price: 34900,
      comparePrice: 39900,
      stock: 30,
      isFeatured: true,
      warranty: "1 Year Official Warranty",
      colors: ["Black", "Silver"],
      description: "Industry-leading noise cancellation, 30-hour battery.",
      specs: { Type: "Over-ear", "Battery Life": "30 hours", Connectivity: "Bluetooth 5.2" },
    },
    {
      name: "Anker PowerCore 20000",
      category: "Accessories",
      brand: "Anker",
      price: 5900,
      stock: 3, // low stock (below default lowStockAt of 5)
      description: "20000mAh portable power bank with fast charging.",
      specs: { Capacity: "20000mAh", Output: "20W USB-C PD", Ports: "2" },
    },
  ];

  for (const p of products) {
    const slug = slugify(p.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        isFeatured: p.isFeatured ?? false,
        isActive: true, // keep seed products live even if a test toggled them
        isDeleted: false,
        warranty: p.warranty ?? null,
        colors: p.colors ?? [],
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        isFeatured: p.isFeatured ?? false,
        warranty: p.warranty ?? null,
        colors: p.colors ?? [],
        categoryId: categories[p.category]!,
        brandId: brands[p.brand]!,
      },
    });

    // Reset specs to keep seed idempotent.
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    await prisma.productSpec.createMany({
      data: Object.entries(p.specs).map(([key, value]) => ({
        productId: product.id,
        key,
        value,
      })),
    });

    // One placeholder image per product (real Cloudinary uploads in Phase 4).
    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });
    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://placehold.co/600x600?text=${encodeURIComponent(p.name)}`,
          alt: p.name,
          position: 0,
        },
      });
    }
  }

  console.log(
    `✓ Seeded ${categoryNames.length} categories, ${brandNames.length} brands, ${products.length} products`,
  );
}

async function seedReviews() {
  // A few reviewer accounts so products can have multiple distinct reviews
  // (Review is unique per [productId, userId]).
  const reviewers = [
    { name: "Rahim Uddin", email: "rahim@storecraft.test" },
    { name: "Karim Ali", email: "karim@storecraft.test" },
    { name: "Fatima Akter", email: "fatima@storecraft.test" },
  ];
  const reviewerIds: Record<string, string> = {};
  for (const r of reviewers) {
    const u = await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name },
      create: {
        name: r.name,
        email: r.email,
        password: await hash("Reviewer@12345"),
        role: "CUSTOMER",
      },
    });
    reviewerIds[r.email] = u.id;
  }

  // productSlug -> reviews
  const reviewsBySlug: Record<
    string,
    Array<{ email: string; rating: number; comment: string }>
  > = {
    "macbook-air-m3-13-inch": [
      { email: "rahim@storecraft.test", rating: 5, comment: "Incredibly fast and light." },
      { email: "karim@storecraft.test", rating: 5, comment: "Best laptop I've owned." },
      { email: "fatima@storecraft.test", rating: 4, comment: "Great, but pricey." },
    ],
    "iphone-15-pro": [
      { email: "rahim@storecraft.test", rating: 5, comment: "Camera is stunning." },
      { email: "fatima@storecraft.test", rating: 4, comment: "Battery could be better." },
    ],
    "sony-wh-1000xm5-headphones": [
      { email: "karim@storecraft.test", rating: 5, comment: "Noise cancellation is unreal." },
      { email: "rahim@storecraft.test", rating: 4, comment: "Comfortable for long flights." },
      { email: "fatima@storecraft.test", rating: 5, comment: "Worth every taka." },
    ],
    "dell-xps-13-plus": [
      { email: "karim@storecraft.test", rating: 4, comment: "Beautiful OLED screen." },
    ],
    "anker-powercore-20000": [
      { email: "fatima@storecraft.test", rating: 3, comment: "Heavy but reliable." },
      { email: "karim@storecraft.test", rating: 4, comment: "Charges my phone many times." },
    ],
  };

  let total = 0;
  for (const [slug, reviews] of Object.entries(reviewsBySlug)) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) continue;
    for (const rv of reviews) {
      await prisma.review.upsert({
        where: {
          productId_userId: { productId: product.id, userId: reviewerIds[rv.email]! },
        },
        update: { rating: rv.rating, comment: rv.comment },
        create: {
          productId: product.id,
          userId: reviewerIds[rv.email]!,
          rating: rv.rating,
          comment: rv.comment,
        },
      });
      total++;
    }
  }

  // Recompute denormalized aggregates for every product.
  const allProducts = await prisma.product.findMany({ select: { id: true } });
  for (const p of allProducts) {
    const agg = await prisma.review.aggregate({
      where: { productId: p.id, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: p.id },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  }

  console.log(`✓ Seeded ${reviewers.length} reviewers, ${total} reviews + aggregates`);
}

async function seedCoupons() {
  const coupons = [
    { code: "SAVE10", type: "PERCENT" as const, value: 10, minOrder: 0 },
    { code: "FLAT500", type: "FIXED" as const, value: 500, minOrder: 50000 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { type: c.type, value: c.value, minOrder: c.minOrder, isActive: true },
      create: { code: c.code, type: c.type, value: c.value, minOrder: c.minOrder },
    });
  }
  console.log(`✓ Seeded ${coupons.length} coupons`);
}

async function main() {
  console.log("Seeding database…");
  await seedUsers();
  await seedCatalog();
  await seedReviews();
  await seedCoupons();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
