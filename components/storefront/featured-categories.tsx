import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Headphones,
  Cable,
  Watch,
  Tablet,
  Speaker,
  Camera,
  Gamepad2,
  Package,
  type LucideIcon,
} from "lucide-react";

/** Map a category slug (or name keyword) to a representative icon. */
const ICONS: Record<string, LucideIcon> = {
  smartphones: Smartphone,
  phones: Smartphone,
  mobile: Smartphone,
  laptops: Laptop,
  computer: Laptop,
  computers: Laptop,
  audio: Headphones,
  headphones: Headphones,
  accessories: Cable,
  wearables: Watch,
  watches: Watch,
  tablets: Tablet,
  speakers: Speaker,
  cameras: Camera,
  gaming: Gamepad2,
};

function iconFor(slug: string, name: string): LucideIcon {
  const key = slug.toLowerCase();
  const direct = ICONS[key];
  if (direct) return direct;
  const hit = Object.keys(ICONS).find((k) => key.includes(k) || name.toLowerCase().includes(k));
  return (hit && ICONS[hit]) || Package;
}

export function FeaturedCategories({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  if (categories.length === 0) return null;

  return (
    <section data-testid="featured-categories">
      <h2 className="mb-3 text-lg font-bold text-ink">
        Featured <span className="text-accent">Categories</span>
      </h2>
      {/* Horizontal scroll on mobile, wrapped grid on larger screens. */}
      <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-8">
        {categories.map((c) => {
          const Icon = iconFor(c.slug, c.name);
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex min-w-[92px] flex-1 flex-col items-center gap-2 rounded-lg border border-hairline bg-surface p-3 transition-colors hover:border-accent"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span className="text-center text-xs font-medium leading-tight text-ink">
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
