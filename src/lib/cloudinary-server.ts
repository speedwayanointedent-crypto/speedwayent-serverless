import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "djmeupzot",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(buffer: Buffer, folder = "products", options: any = {}) {
  return new Promise<{ url: string; publicId: string; width?: number; height?: number }>((resolve, reject) => {
    const filename = `${folder}/${crypto.randomUUID()}.jpg`;
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
          public_id: filename.split("/").pop()!.replace(".jpg", ""),
          transformation: [
            { width: 1400, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
          ...options,
        },
        (error, result: any) => {
          if (error) reject(error);
          else resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
        }
      )
      .end(buffer);
  });
}

export async function uploadGalleryImage(buffer: Buffer, folder = "products/gallery") {
  return uploadImage(buffer, folder);
}

export async function uploadVideo(buffer: Buffer, folder = "products/videos") {
  return new Promise<{ url: string; publicId: string; thumbnail?: string; width?: number; height?: number; duration?: number }>((resolve, reject) => {
    const publicId = `${folder}/${crypto.randomUUID()}`;
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "video",
          public_id: publicId.split("/").pop(),
          chunk_size: 6000000,
          eager: [
            { quality: "auto", fetch_format: "mp4" },
            { format: "jpg", transformation: [{ width: 400, height: 300, crop: "fill" }] },
          ],
        },
        (error, result: any) => {
          if (error) reject(error);
          else
            resolve({
              url: getVideoStreamingUrl(result.public_id),
              publicId: result.public_id,
              thumbnail: getVideoThumbnail(result.public_id),
              width: result.width,
              height: result.height,
              duration: result.duration,
            });
        }
      )
      .end(buffer);
  });
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(publicId: string, options: any = {}) {
  return cloudinary.url(publicId, { fetch_format: "auto", quality: "auto", ...options });
}

export function getVideoStreamingUrl(publicId: string) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    streaming_attachment: "inline",
    fetch_format: "auto",
    quality: "auto",
  });
}

export function getVideoThumbnail(publicId: string) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [{ width: 400, height: 300, crop: "fill" }],
  });
}

export { cloudinary };
