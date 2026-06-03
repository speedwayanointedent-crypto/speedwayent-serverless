import { type NextRequest } from "next/server";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { uploadImage } from "@/lib/cloudinary-server";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return jsonResponse({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return jsonResponse({ error: "File too large (max 5MB)" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buf, "products");
    return jsonResponse({ url: result.url });
  });
}
