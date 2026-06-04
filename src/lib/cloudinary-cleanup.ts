import { cloudinary } from "./cloudinary-server";

function extractPublicId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|mp4|mov|webm|avi)/i);
    if (!match) return null;
    const withoutExt = match[1];
    const folder = withoutExt.split("/").slice(0, -1).join("/");
    const filename = withoutExt.split("/").pop()!.replace(/\.[^.]+$/, "");
    return folder ? `${folder}/${filename}` : filename;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryAssets(urls: (string | null | undefined)[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  for (const url of urls) {
    const publicId = extractPublicId(url);
    if (!publicId) continue;
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
      deleted++;
    } catch (err) {
      console.error("[cloudinary] failed to delete", publicId, (err as Error).message);
      failed++;
    }
  }
  return { deleted, failed };
}

export async function deleteFromProduct(doc: any) {
  const urls: (string | null | undefined)[] = [];
  if (doc?.image_url) urls.push(doc.image_url);
  if (Array.isArray(doc?.gallery)) {
    for (const g of doc.gallery) {
      if (typeof g === "string") urls.push(g);
      else if (g?.url) urls.push(g.url);
    }
  }
  if (Array.isArray(doc?.videos)) {
    for (const v of doc.videos) {
      if (typeof v === "string") urls.push(v);
      else if (v?.url) urls.push(v.url);
    }
  }
  return deleteCloudinaryAssets(urls);
}

export { extractPublicId };
