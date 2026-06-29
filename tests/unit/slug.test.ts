import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("MacBook Air M3")).toBe("macbook-air-m3");
  });

  it("strips punctuation", () => {
    expect(slugify("Sony WH-1000XM5 (Black)!")).toBe("sony-wh-1000xm5-black");
  });

  it("collapses whitespace and underscores", () => {
    expect(slugify("  hello___world  ")).toBe("hello-world");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("--edge--")).toBe("edge");
  });
});
