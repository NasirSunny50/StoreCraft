/**
 * Colour options are stored as strings in Product.colors. New entries encode a
 * name and a swatch hex as "Name|#RRGGBB"; legacy entries are just "Name".
 * Helpers here parse/serialize both and map common ("generic") colour names to
 * a hex so the admin picker can auto-fill them.
 */

/** Common product colours → hex, so generic names auto-fill the palette. */
export const KNOWN_COLORS: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  silver: "#c8c9cc",
  gray: "#808080",
  grey: "#808080",
  "space gray": "#4b4f56",
  "space grey": "#4b4f56",
  graphite: "#3a3a3c",
  gold: "#d4af37",
  "rose gold": "#b76e79",
  blue: "#2563eb",
  navy: "#1e3a8a",
  "sierra blue": "#9bbcd8",
  red: "#dc2626",
  green: "#16a34a",
  midnight: "#1c1f2a",
  starlight: "#faf6ef",
  purple: "#7c3aed",
  pink: "#ec4899",
  yellow: "#eab308",
  orange: "#f97316",
  titanium: "#8a8780",
  "natural titanium": "#b6afa3",
  "blue titanium": "#4b5a6b",
  bronze: "#cd7f32",
  teal: "#14b8a6",
  beige: "#e8e0d0",
  cream: "#f5f1e6",
};

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

/** Hex for a generic colour name, or null when it isn't a known one. */
export function knownHex(name: string): string | null {
  return KNOWN_COLORS[name.trim().toLowerCase()] ?? null;
}

/** Encode a colour option for storage. */
export function serializeColorOption(name: string, hex: string): string {
  return `${name.trim()}|${hex}`;
}

/**
 * Parse a stored colour option into a display name + a CSS swatch colour.
 * - "Name|#hex" → { name, swatch: "#hex" }
 * - "Name" (legacy) → { name, swatch: known hex, else the CSS-name form }
 */
export function parseColorOption(entry: string): { name: string; swatch: string } {
  const sep = entry.indexOf("|");
  if (sep !== -1) {
    const name = entry.slice(0, sep).trim();
    const hex = entry.slice(sep + 1).trim();
    return { name, swatch: HEX_RE.test(hex) ? (hex.startsWith("#") ? hex : `#${hex}`) : name };
  }
  const name = entry.trim();
  return { name, swatch: knownHex(name) ?? name.toLowerCase().replace(/\s+/g, "") };
}

/** Just the human name of a stored colour option (for cart/order display). */
export function colorName(entry: string): string {
  return parseColorOption(entry).name;
}
