import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses a simple table keyed by header", () => {
    expect(parseCsv("name,price\nMouse,500")).toEqual([{ name: "Mouse", price: "500" }]);
  });

  it("handles quoted fields containing commas", () => {
    const rows = parseCsv('name,desc\n"Cable, USB-C",10');
    expect(rows[0]).toEqual({ name: "Cable, USB-C", desc: "10" });
  });

  it("handles escaped double quotes", () => {
    const rows = parseCsv('note\n"he said ""hi"""');
    expect(rows[0]?.note).toBe('he said "hi"');
  });

  it("skips blank lines", () => {
    expect(parseCsv("a\n1\n\n2")).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("tolerates trailing CRLF", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([{ a: "1", b: "2" }]);
  });
});
