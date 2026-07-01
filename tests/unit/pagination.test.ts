import { describe, it, expect } from "vitest";
import { parsePageParams, DEFAULT_PER_PAGE } from "@/lib/pagination";

describe("parsePageParams", () => {
  it("defaults to page 1 and 10 per page", () => {
    expect(parsePageParams({})).toEqual({ page: 1, perPage: 10, skip: 0, take: 10 });
    expect(DEFAULT_PER_PAGE).toBe(10);
  });

  it("computes skip/take from page + perPage", () => {
    expect(parsePageParams({ page: "3", perPage: "25" })).toEqual({
      page: 3,
      perPage: 25,
      skip: 50,
      take: 25,
    });
  });

  it("accepts the allowed per-page sizes", () => {
    for (const n of [10, 25, 50, 100]) {
      expect(parsePageParams({ perPage: String(n) }).perPage).toBe(n);
    }
  });

  it("falls back to 10 for an unsupported per-page value", () => {
    expect(parsePageParams({ perPage: "999" }).perPage).toBe(10);
    expect(parsePageParams({ perPage: "7" }).perPage).toBe(10);
  });

  it("clamps invalid page numbers to 1", () => {
    expect(parsePageParams({ page: "0" }).page).toBe(1);
    expect(parsePageParams({ page: "-4" }).page).toBe(1);
    expect(parsePageParams({ page: "abc" }).page).toBe(1);
  });
});
