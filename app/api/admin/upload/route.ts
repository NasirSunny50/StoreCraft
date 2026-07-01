import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";

const ALLOWED = new Set(["image/jpeg", "image/png"]);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Local image upload (JPG/PNG → /public/uploads). ADMIN only.
 * For production this would be swapped for Cloudinary; the stored value is a URL
 * either way, so the rest of the app is unaffected.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "Only JPG or PNG images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const name = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  return Response.json({ url: `/uploads/${name}` });
}
