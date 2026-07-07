import type { PrismaClient } from "@prisma/client";

/**
 * Demo catalog: 6 products per category (Smartphones, Laptops, Audio,
 * Accessories) with full, realistic info. Idempotent — upserts by slug, so it's
 * safe to run repeatedly and it updates the existing seed products in place.
 * Images are left as labelled placeholders for the admin to replace with the
 * exact-model photos.
 */

export type CatalogProduct = {
  name: string;
  category: "Smartphones" | "Laptops" | "Audio" | "Accessories";
  brand: string;
  price: number;
  comparePrice?: number;
  stock: number;
  isFeatured?: boolean;
  warranty?: string;
  colors?: string[];
  description: string;
  specs: Record<string, string>;
};

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  // ─────────────── Smartphones ───────────────
  {
    name: "iPhone 15 Pro",
    category: "Smartphones",
    brand: "Apple",
    price: 134900,
    comparePrice: 139900,
    stock: 20,
    isFeatured: true,
    warranty: "1 Year Apple Warranty",
    colors: ["Natural Titanium", "Blue Titanium", "Black Titanium", "White Titanium"],
    description:
      "A17 Pro chip, aerospace-grade titanium design, and a 48MP main camera with 5x telephoto. The most powerful iPhone Pro yet.",
    specs: { Chip: "A17 Pro", RAM: "8GB", Storage: "128GB", Display: "6.1-inch Super Retina XDR", Camera: "48MP Main", Battery: "Up to 23h video" },
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    category: "Smartphones",
    brand: "Samsung",
    price: 144900,
    stock: 15,
    isFeatured: true,
    warranty: "1 Year Samsung Warranty",
    colors: ["Titanium Gray", "Titanium Black", "Titanium Violet", "Titanium Yellow"],
    description:
      "Snapdragon 8 Gen 3, a 200MP camera, built-in S Pen and a brilliant 6.8-inch display with Galaxy AI features.",
    specs: { Chip: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB", Display: "6.8-inch Dynamic AMOLED 2X", Camera: "200MP", "S Pen": "Included" },
  },
  {
    name: "iPhone 15",
    category: "Smartphones",
    brand: "Apple",
    price: 114900,
    comparePrice: 119900,
    stock: 18,
    warranty: "1 Year Apple Warranty",
    colors: ["Black", "Blue", "Green", "Pink", "Yellow"],
    description:
      "A16 Bionic, the Dynamic Island, a 48MP main camera and USB-C — all in a durable colour-infused glass design.",
    specs: { Chip: "A16 Bionic", RAM: "6GB", Storage: "128GB", Display: "6.1-inch Super Retina XDR", Camera: "48MP Main", Port: "USB-C" },
  },
  {
    name: "Google Pixel 8 Pro",
    category: "Smartphones",
    brand: "Google",
    price: 109900,
    stock: 10,
    warranty: "1 Year Warranty",
    colors: ["Obsidian", "Porcelain", "Bay"],
    description:
      "Google Tensor G3 with the best of Google AI, a pro triple camera and a 6.7-inch Super Actua LTPO display.",
    specs: { Chip: "Google Tensor G3", RAM: "12GB", Storage: "128GB", Display: "6.7-inch LTPO OLED", Camera: "50MP Triple", Battery: "5050mAh" },
  },
  {
    name: "Samsung Galaxy S24",
    category: "Smartphones",
    brand: "Samsung",
    price: 99900,
    comparePrice: 104900,
    stock: 14,
    warranty: "1 Year Samsung Warranty",
    colors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"],
    description:
      "Compact flagship with Snapdragon 8 Gen 3, Galaxy AI, and a bright 6.2-inch 120Hz AMOLED display.",
    specs: { Chip: "Snapdragon 8 Gen 3", RAM: "8GB", Storage: "256GB", Display: "6.2-inch Dynamic AMOLED 2X", Camera: "50MP Triple", Battery: "4000mAh" },
  },
  {
    name: "OnePlus 12",
    category: "Smartphones",
    brand: "OnePlus",
    price: 89900,
    stock: 12,
    warranty: "1 Year Warranty",
    colors: ["Silky Black", "Flowy Emerald"],
    description:
      "Snapdragon 8 Gen 3, a Hasselblad-tuned camera, 100W fast charging and a stunning 6.82-inch ProXDR display.",
    specs: { Chip: "Snapdragon 8 Gen 3", RAM: "12GB", Storage: "256GB", Display: "6.82-inch ProXDR", Camera: "50MP Hasselblad", Charging: "100W SUPERVOOC" },
  },

  // ─────────────── Laptops ───────────────
  {
    name: "MacBook Air M3 13-inch",
    category: "Laptops",
    brand: "Apple",
    price: 149900,
    comparePrice: 159900,
    stock: 12,
    isFeatured: true,
    warranty: "1 Year Apple Warranty",
    description: "Apple M3 chip, 8-core CPU, 16GB RAM, 256GB SSD. Featherlight and silent, with all-day battery life.",
    specs: { Chip: "Apple M3", RAM: "16GB", Storage: "256GB SSD", Display: "13.6-inch Liquid Retina", Battery: "Up to 18h", Weight: "1.24kg" },
  },
  {
    name: "Dell XPS 13 Plus",
    category: "Laptops",
    brand: "Dell",
    price: 139900,
    stock: 7,
    isFeatured: true,
    warranty: "1 Year Warranty",
    description: "Intel Core Ultra 7, 16GB RAM, 512GB SSD and a stunning 13.4-inch OLED touch display in an edge-to-edge design.",
    specs: { CPU: "Intel Core Ultra 7", RAM: "16GB", Storage: "512GB SSD", Display: "13.4-inch OLED Touch", Graphics: "Intel Arc", Weight: "1.26kg" },
  },
  {
    name: "MacBook Pro 14 M3 Pro",
    category: "Laptops",
    brand: "Apple",
    price: 219900,
    stock: 6,
    isFeatured: true,
    warranty: "1 Year Apple Warranty",
    description: "M3 Pro with 12-core CPU and 18GB unified memory, a Liquid Retina XDR display and pro-grade performance for creators.",
    specs: { Chip: "Apple M3 Pro", RAM: "18GB", Storage: "512GB SSD", Display: "14.2-inch Liquid Retina XDR", Battery: "Up to 18h", Ports: "3× Thunderbolt 4" },
  },
  {
    name: "ASUS ROG Zephyrus G14",
    category: "Laptops",
    brand: "ASUS",
    price: 189900,
    comparePrice: 199900,
    stock: 5,
    warranty: "2 Year Warranty",
    description: "AMD Ryzen 9 with GeForce RTX 4060, a 14-inch OLED 120Hz display — serious gaming power in an ultraportable body.",
    specs: { CPU: "AMD Ryzen 9 8945HS", GPU: "RTX 4060 8GB", RAM: "16GB", Storage: "1TB SSD", Display: "14-inch OLED 120Hz" },
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 12",
    category: "Laptops",
    brand: "Lenovo",
    price: 174900,
    stock: 8,
    warranty: "3 Year Warranty",
    description: "Iconic business ultrabook — Intel Core Ultra 7, 16GB RAM, MIL-SPEC durability and a legendary keyboard.",
    specs: { CPU: "Intel Core Ultra 7", RAM: "16GB", Storage: "512GB SSD", Display: "14-inch WUXGA IPS", Weight: "1.09kg", Security: "Fingerprint + IR" },
  },
  {
    name: "HP Spectre x360 14",
    category: "Laptops",
    brand: "HP",
    price: 154900,
    stock: 6,
    warranty: "1 Year Warranty",
    description: "Premium 2-in-1 convertible with Intel Core Ultra 7, a 2.8K OLED touch display and a gem-cut aluminium chassis.",
    specs: { CPU: "Intel Core Ultra 7", RAM: "16GB", Storage: "1TB SSD", Display: "14-inch 2.8K OLED Touch", Type: "2-in-1 Convertible", Pen: "Included" },
  },

  // ─────────────── Audio ───────────────
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
    description: "Industry-leading noise cancellation, crystal-clear calls and up to 30 hours of battery in a plush over-ear design.",
    specs: { Type: "Over-ear", "Battery Life": "30 hours", Connectivity: "Bluetooth 5.2", "Noise Cancelling": "Yes", "Quick Charge": "3 min = 3h" },
  },
  {
    name: "Apple AirPods Pro 2",
    category: "Audio",
    brand: "Apple",
    price: 27900,
    stock: 25,
    isFeatured: true,
    warranty: "1 Year Apple Warranty",
    description: "H2 chip with 2× the Active Noise Cancellation, Adaptive Audio and a USB-C MagSafe charging case.",
    specs: { Type: "In-ear", Chip: "Apple H2", "Battery Life": "6h (30h with case)", Port: "USB-C", Features: "Adaptive Audio, Transparency" },
  },
  {
    name: "Bose QuietComfort Ultra",
    category: "Audio",
    brand: "Bose",
    price: 42900,
    comparePrice: 45900,
    stock: 12,
    warranty: "1 Year Warranty",
    colors: ["Black", "White Smoke"],
    description: "Bose's best noise cancellation with breakthrough Immersive Audio for spatial sound and a luxurious fit.",
    specs: { Type: "Over-ear", "Battery Life": "24 hours", Connectivity: "Bluetooth 5.3", Feature: "Immersive Audio", Mic: "Yes" },
  },
  {
    name: "Sennheiser Momentum 4",
    category: "Audio",
    brand: "Sennheiser",
    price: 39900,
    stock: 10,
    warranty: "2 Year Warranty",
    description: "Audiophile signature sound, adaptive noise cancellation and an astonishing 60-hour battery life.",
    specs: { Type: "Over-ear", "Battery Life": "60 hours", Codec: "aptX Adaptive", Connectivity: "Bluetooth 5.2", "Noise Cancelling": "Adaptive" },
  },
  {
    name: "JBL Charge 5",
    category: "Audio",
    brand: "JBL",
    price: 15900,
    stock: 20,
    warranty: "1 Year Warranty",
    colors: ["Black", "Blue", "Red", "Camo"],
    description: "Bold JBL Pro Sound, IP67 dust/waterproofing and a built-in powerbank — the go-anywhere portable speaker.",
    specs: { Type: "Portable Speaker", "Battery Life": "20 hours", Rating: "IP67 Waterproof", Feature: "Powerbank", Connectivity: "Bluetooth 5.1" },
  },
  {
    name: "Samsung Galaxy Buds3 Pro",
    category: "Audio",
    brand: "Samsung",
    price: 22900,
    stock: 18,
    warranty: "1 Year Samsung Warranty",
    colors: ["Silver", "White"],
    description: "Blade-design earbuds with intelligent ANC, 24-bit Hi-Fi audio and real-time interpretation with Galaxy AI.",
    specs: { Type: "In-ear", "Battery Life": "6h (26h with case)", Audio: "24-bit Hi-Fi", "Noise Cancelling": "Intelligent ANC", Rating: "IP57" },
  },

  // ─────────────── Accessories ───────────────
  {
    name: "Anker PowerCore 20000",
    category: "Accessories",
    brand: "Anker",
    price: 5900,
    stock: 15,
    description: "20,000mAh portable power bank with 20W USB-C Power Delivery — recharge a phone up to four times.",
    specs: { Capacity: "20000mAh", Output: "20W USB-C PD", Ports: "2", Input: "USB-C", Weight: "343g" },
  },
  {
    name: "Logitech MX Master 3S",
    category: "Accessories",
    brand: "Logitech",
    price: 11900,
    stock: 15,
    warranty: "1 Year Warranty",
    colors: ["Graphite", "Pale Gray"],
    description: "The master productivity mouse — 8K DPI tracking, near-silent Quiet Clicks and MagSpeed electromagnetic scrolling.",
    specs: { DPI: "8000", Buttons: "7", Battery: "70 days", Connectivity: "Bluetooth / USB-C Bolt", Feature: "Quiet Clicks" },
  },
  {
    name: "Apple Magic Keyboard",
    category: "Accessories",
    brand: "Apple",
    price: 13900,
    stock: 10,
    warranty: "1 Year Apple Warranty",
    description: "A sleek, rechargeable wireless keyboard with Touch ID and a stable scissor mechanism for a comfortable, precise feel.",
    specs: { Type: "Wireless", "Touch ID": "Yes (Apple Silicon Macs)", Battery: "Rechargeable, ~1 month", Connectivity: "Bluetooth", Layout: "Full with Numeric" },
  },
  {
    name: "Samsung T7 Portable SSD 1TB",
    category: "Accessories",
    brand: "Samsung",
    price: 12900,
    comparePrice: 14900,
    stock: 14,
    warranty: "3 Year Warranty",
    colors: ["Titan Gray", "Indigo Blue", "Metallic Red"],
    description: "Pocket-sized 1TB SSD with blazing USB 3.2 Gen 2 speeds up to 1,050MB/s and shock-resistant durability.",
    specs: { Capacity: "1TB", Interface: "USB 3.2 Gen 2", "Read Speed": "Up to 1050MB/s", Durability: "2m drop resistant", Weight: "58g" },
  },
  {
    name: "Anker 65W GaN Charger",
    category: "Accessories",
    brand: "Anker",
    price: 4900,
    stock: 25,
    warranty: "18 Month Warranty",
    description: "Compact 65W GaN II charger with three ports — power a laptop, tablet and phone at full speed from one plug.",
    specs: { Output: "65W Max", Technology: "GaN II", Ports: "2× USB-C + 1× USB-A", Feature: "Foldable Plug", Compatibility: "Laptops & Phones" },
  },
  {
    name: "UGREEN 6-in-1 USB-C Hub",
    category: "Accessories",
    brand: "UGREEN",
    price: 4500,
    stock: 20,
    warranty: "1 Year Warranty",
    description: "Expand a single USB-C port into 4K HDMI, three USB ports, SD/microSD readers and 100W pass-through charging.",
    specs: { HDMI: "4K@30Hz", USB: "3× USB 3.0", "Card Reader": "SD + microSD", "PD Charging": "100W Pass-through", Build: "Aluminium" },
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CatalogResult = { categories: number; brands: number; products: number };

/**
 * Upsert the demo catalog into the given Prisma client. Idempotent: categories
 * and brands are upserted by slug, products by slug (created or refreshed).
 * Specs are reset each run; a labelled placeholder image is added only when a
 * product has none, so admin-uploaded photos are never overwritten.
 */
export async function upsertCatalog(prisma: PrismaClient): Promise<CatalogResult> {
  const categoryNames = [...new Set(CATALOG_PRODUCTS.map((p) => p.category))];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categories[name] = cat.id;
  }

  const brandNames = [...new Set(CATALOG_PRODUCTS.map((p) => p.brand))];
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    brands[name] = brand.id;
  }

  for (const p of CATALOG_PRODUCTS) {
    const slug = slugify(p.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        isFeatured: p.isFeatured ?? false,
        isActive: true,
        isDeleted: false,
        warranty: p.warranty ?? null,
        colors: p.colors ?? [],
        categoryId: categories[p.category]!,
        brandId: brands[p.brand]!,
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

    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    await prisma.productSpec.createMany({
      data: Object.entries(p.specs).map(([key, value]) => ({ productId: product.id, key, value })),
    });

    const existingImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
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

  return { categories: categoryNames.length, brands: brandNames.length, products: CATALOG_PRODUCTS.length };
}
