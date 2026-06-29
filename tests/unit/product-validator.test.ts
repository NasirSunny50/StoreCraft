import { describe, it, expect } from "vitest";
import { parseProductFilter } from "@/lib/validators/product";

describe("parseProductFilter", () => {
  it("defaults to newest sort and inStock false", () => {
    const f = parseProductFilter({});
    expect(f.sort).toBe("newest");
    expect(f.inStock).toBe(false);
  });

  it("accepts valid sort values", () => {
    expect(parseProductFilter({ sort: "price-asc" }).sort).toBe("price-asc");
    expect(parseProductFilter({ sort: "popularity" }).sort).toBe("popularity");
  });

  it("falls back to newest for an invalid sort", () => {
    expect(parseProductFilter({ sort: "garbage" }).sort).toBe("newest");
  });

  it("coerces inStock from the string 'true'", () => {
    expect(parseProductFilter({ inStock: "true" }).inStock).toBe(true);
    expect(parseProductFilter({ inStock: "false" }).inStock).toBe(false);
  });

  it("coerces numeric price/rating", () => {
    const f = parseProductFilter({ minPrice: "100", maxPrice: "500", minRating: "4" });
    expect(f.minPrice).toBe(100);
    expect(f.maxPrice).toBe(500);
    expect(f.minRating).toBe(4);
  });

  it("drops invalid numeric values instead of throwing", () => {
    const f = parseProductFilter({ minPrice: "abc", minRating: "99" });
    expect(f.minPrice).toBeUndefined();
    expect(f.minRating).toBeUndefined();
  });

  it("trims search query and treats empty as undefined", () => {
    expect(parseProductFilter({ q: "  laptop " }).q).toBe("laptop");
    expect(parseProductFilter({ q: "" }).q).toBeUndefined();
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseProductFilter({ category: ["laptops", "audio"] }).category).toBe("laptops");
  });
});
