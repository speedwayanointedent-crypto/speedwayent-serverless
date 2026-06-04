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
    const hiddenBrands = await collections
      .brands()
      .find({ is_hidden: true }, { projection: { _id: 1 } })
      .toArray();
    const hiddenSet = new Set(hiddenBrands.map((b: any) => b._id.toString()));

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
        {
          $project: {
            _id: 1,
            name: 1,
            brand_id: 1,
            years: 1,
            image_url: 1,
            gallery: 1,
            is_hidden: 1,
            created_at: 1,
            updated_at: 1,
            brand_data: { _id: 1, name: 1, logo_url: 1, is_hidden: 1 },
            brands: {
              id: "$brand_data._id",
              name: "$brand_data.name",
              logo_url: "$brand_data.logo_url",
            },
          },
        },
      ])
      .toArray();

    const filtered = data.filter((m: any) => {
      if (!m.brand_id) return true;
      return !hiddenSet.has(m.brand_id.toString());
    });
    const normalized = filtered.map((m: any) => {
      const { _id, brand_data, ...rest } = m;
      return { id: _id?.toString() ?? "", ...rest };
    });
    return jsonResponse(normalized);
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
