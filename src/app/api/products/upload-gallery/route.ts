import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { uploadImage, uploadVideo } from "@/lib/cloudinary-server";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: "No file uploaded" }, { status: 400 });
    }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      return jsonResponse({ error: "Only images and videos are allowed" }, { status: 400 });
    }
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return jsonResponse(
        { error: `File too large. Max ${(maxBytes / (1024 * 1024)).toFixed(0)}MB for ${isVideo ? "videos" : "images"}.` },
        { status: 413 }
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const result = isVideo
      ? await uploadVideo(buf, "products/videos")
      : await uploadImage(buf, "products/gallery");
    return jsonResponse({ url: result.url, type: isVideo ? "video" : "image" });
  });
}
