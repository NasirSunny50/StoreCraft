import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  validateImage,
  cloudinaryConfigured,
  storeImage,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload";

const CLOUD_KEYS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

describe("validateImage", () => {
  it("accepts JPG and PNG within the size limit", () => {
    expect(validateImage({ type: "image/jpeg", size: 1000 })).toEqual({ ok: true });
    expect(validateImage({ type: "image/png", size: 1000 })).toEqual({ ok: true });
  });

  it("rejects disallowed types", () => {
    const r = validateImage({ type: "image/gif", size: 10 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/JPG or PNG/);
  });

  it("rejects files over the size limit", () => {
    const r = validateImage({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5MB/);
  });
});

describe("cloudinaryConfigured", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of CLOUD_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of CLOUD_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("is false when any credential is missing", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    // secret missing
    expect(cloudinaryConfigured()).toBe(false);
  });

  it("is true when all credentials are present", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";
    expect(cloudinaryConfigured()).toBe(true);
  });
});

describe("storeImage (local fallback)", () => {
  const saved: Record<string, string | undefined> = {};
  const written: string[] = [];

  beforeEach(() => {
    // Force the local-disk path by clearing Cloudinary creds.
    for (const k of CLOUD_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(async () => {
    for (const k of CLOUD_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    for (const rel of written.splice(0)) {
      await rm(join(process.cwd(), "public", rel.replace(/^\//, "")), { force: true });
    }
  });

  it("writes the file under /public/uploads and returns its URL", async () => {
    const file = new File([Buffer.from("fake-png-bytes")], "x.png", { type: "image/png" });
    const url = await storeImage(file);
    written.push(url);

    expect(url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    const onDisk = await readFile(join(process.cwd(), "public", url.replace(/^\//, "")));
    expect(onDisk.toString()).toBe("fake-png-bytes");
  });
});
