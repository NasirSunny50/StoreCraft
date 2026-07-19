import { describe, it, expect } from "vitest";
import { normalizeBannerSet } from "@/lib/banners";
import { bannerSetSchema } from "@/lib/validators/banner";

describe("normalizeBannerSet", () => {
  it("returns an empty set for junk / null", () => {
    expect(normalizeBannerSet(null)).toEqual({ main: [], sideTop: null, sideBottom: null });
    expect(normalizeBannerSet(42)).toEqual({ main: [], sideTop: null, sideBottom: null });
    expect(normalizeBannerSet({})).toEqual({ main: [], sideTop: null, sideBottom: null });
  });

  it("reads the current object shape", () => {
    const set = normalizeBannerSet({
      main: [{ imageUrl: "/a.png", href: "/x" }],
      sideTop: { imageUrl: "/t.png", href: "" },
      sideBottom: null,
    });
    expect(set.main).toEqual([{ imageUrl: "/a.png", href: "/x" }]);
    expect(set.sideTop).toEqual({ imageUrl: "/t.png", href: "" });
    expect(set.sideBottom).toBeNull();
  });

  it("supports the legacy plain-array format as main banners", () => {
    const set = normalizeBannerSet([{ imageUrl: "/a.png", href: "/x" }]);
    expect(set.main).toHaveLength(1);
    expect(set.sideTop).toBeNull();
    expect(set.sideBottom).toBeNull();
  });

  it("drops entries without an image and defaults a missing href to empty", () => {
    const set = normalizeBannerSet({
      main: [{ imageUrl: "/a.png" }, { imageUrl: "" }, { href: "/no-image" }, "junk"],
      sideTop: { imageUrl: "   " },
    });
    expect(set.main).toEqual([{ imageUrl: "/a.png", href: "" }]);
    expect(set.sideTop).toBeNull(); // whitespace-only image → dropped
  });
});

describe("bannerSetSchema", () => {
  const base = { main: [], sideTop: null, sideBottom: null };

  it("accepts a valid set with internal and absolute links", () => {
    const r = bannerSetSchema.safeParse({
      main: [{ imageUrl: "/a.png", href: "/category/audio" }, { imageUrl: "/b.png", href: "https://x.com" }],
      sideTop: { imageUrl: "/t.png", href: "" },
      sideBottom: null,
    });
    expect(r.success).toBe(true);
  });

  it("requires an image on each banner", () => {
    expect(bannerSetSchema.safeParse({ ...base, main: [{ imageUrl: "", href: "" }] }).success).toBe(false);
  });

  it("rejects a link that is neither a path nor http(s)", () => {
    expect(
      bannerSetSchema.safeParse({ ...base, sideTop: { imageUrl: "/t.png", href: "javascript:alert(1)" } }).success,
    ).toBe(false);
  });

  it("rejects more than 12 main banners", () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ imageUrl: `/b${i}.png`, href: "" }));
    expect(bannerSetSchema.safeParse({ ...base, main: many }).success).toBe(false);
  });
});
