import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ImageValidation = { ok: true } | { ok: false; error: string };

/** Validate an uploaded image by MIME type + size. */
export function validateImage(file: { type: string; size: number }): ImageValidation {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPG or PNG images are allowed." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }
  return { ok: true };
}

/** True when all Cloudinary credentials are present (i.e. production). */
export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "storecraft", resource_type: "image" }, (err, res) => {
        if (err || !res) reject(err ?? new Error("Cloudinary upload failed"));
        else resolve(res as { secure_url: string });
      })
      .end(buffer);
  });
  return result.secure_url;
}

async function saveToLocalDisk(buffer: Buffer, ext: string): Promise<string> {
  const name = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buffer);
  return `/uploads/${name}`;
}

/**
 * Persist an image and return its URL. Uses Cloudinary when configured
 * (production), otherwise falls back to local disk for dev. Either way the
 * returned value is a URL, so the rest of the app is unaffected.
 */
export async function storeImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (cloudinaryConfigured()) {
    return uploadToCloudinary(buffer);
  }
  const ext = file.type === "image/png" ? "png" : "jpg";
  return saveToLocalDisk(buffer, ext);
}
