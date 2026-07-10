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
  Keyboard,
  Mouse,
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
  keyboard: Keyboard,
  keyboards: Keyboard,
  mouse: Mouse,
  mice: Mouse,
};

/** Best-fit icon for a category, falling back to a generic package icon. */
export function categoryIcon(slug: string, name: string): LucideIcon {
  const key = slug.toLowerCase();
  const direct = ICONS[key];
  if (direct) return direct;
  const hit = Object.keys(ICONS).find(
    (k) => key.includes(k) || name.toLowerCase().includes(k),
  );
  return (hit && ICONS[hit]) || Package;
}
