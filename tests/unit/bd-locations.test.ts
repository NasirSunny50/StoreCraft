import { describe, it, expect } from "vitest";
import { BD_CITIES, BD_LOCATIONS, areasForCity } from "@/lib/data/bd-locations";

describe("bd-locations", () => {
  it("exposes a non-trivial list of cities including major ones", () => {
    expect(BD_CITIES.length).toBeGreaterThan(20);
    for (const c of ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"]) {
      expect(BD_CITIES).toContain(c);
    }
  });

  it("returns that city's areas (and empty for unknown cities)", () => {
    expect(areasForCity("Dhaka")).toContain("Mirpur");
    expect(areasForCity("Sylhet")).toContain("Zindabazar");
    expect(areasForCity("Nowhere")).toEqual([]);
  });

  it("has no duplicate city names and every city has at least one area", () => {
    expect(new Set(BD_CITIES).size).toBe(BD_CITIES.length);
    for (const { city, areas } of BD_LOCATIONS) {
      expect(areas.length, `${city} has no areas`).toBeGreaterThan(0);
      expect(new Set(areas).size, `${city} has duplicate areas`).toBe(areas.length);
    }
  });
});
