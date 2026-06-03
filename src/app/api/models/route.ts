import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const modelSchema = z.object({
  name: z.string(),
  brand_id: z.string(),
  years: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional().default([]),
});

export async function GET() {
  return withErrorHandling(async () => {
    const data = await collections
      .models()
      .aggregate([
        { $match: { is_hidden: { $ne: true } } },
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
    return jsonResponse(data);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = modelSchema.parse(body);
    const result = await collections.models().insertOne({
      ...payload,
      brand_id: toObjectId(payload.brand_id) as any,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const inserted = await collections.models().findOne({ _id: result.insertedId });
    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
