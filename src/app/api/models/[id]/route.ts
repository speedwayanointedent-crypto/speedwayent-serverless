import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { deleteCloudinaryAssets } from "@/lib/cloudinary-cleanup";

export const dynamic = "force-dynamic";

const modelSchema = z.object({
  name: z.string(),
  brand_id: z.string(),
  years: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional().default([]),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const model: any[] = await collections
      .models()
      .aggregate([
        { $match: { _id: toObjectId(id) as any } },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand_data",
          },
        },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();
    if (!model || model.length === 0) throw ApiError.notFound("Model not found");
    const m = model[0];
    return jsonResponse({
      id: String(m._id),
      _id: undefined,
      name: m.name,
      brand_id: m.brand_id?.toString(),
      years: m.years,
      image_url: m.image_url,
      gallery: m.gallery,
      brands: { name: m.brand_data?.name },
    });
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const payload = modelSchema.partial().parse(body);
    const updateData: any = { ...payload, updated_at: new Date() };
    if (payload.brand_id) updateData.brand_id = toObjectId(payload.brand_id);
    const result: any = await collections.models().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Model not found");
    return jsonResponse(serializeDoc(result));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const doc = await collections.models().findOne({ _id: toObjectId(id) as any });
    if (!doc) throw ApiError.notFound("Model not found");
    const result = await collections.models().deleteOne({ _id: toObjectId(id) as any });
    if (result.deletedCount === 0) throw ApiError.notFound("Model not found");

    const urls: (string | null | undefined)[] = [doc?.image_url];
    if (Array.isArray(doc?.gallery)) urls.push(...doc.gallery);
    deleteCloudinaryAssets(urls).catch((err) => console.error("[cloudinary] model cleanup failed", err));

    return new Response(null, { status: 204 });
  });
}
