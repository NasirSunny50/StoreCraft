import { auth } from "@/lib/auth";
import { validateImage, storeImage } from "@/lib/upload";

/**
 * Image upload (JPG/PNG). ADMIN only. Stores to Cloudinary in production
 * (when credentials are set) and falls back to /public/uploads locally.
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

  const check = validateImage(file);
  if (!check.ok) {
    return Response.json({ error: check.error }, { status: 400 });
  }

  try {
    const url = await storeImage(file);
    return Response.json({ url });
  } catch {
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
