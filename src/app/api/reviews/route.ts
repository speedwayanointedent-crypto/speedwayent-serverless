import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  product_id: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(5).max(1000),
});

export async function GET() {
  return withErrorHandling(async () => {
    const reviews = await collections
      .reviews()
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data",
          },
        },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            rating: 1,
            title: 1,
            body: 1,
            created_at: 1,
            product_id: 1,
            user_data: { full_name: 1 },
            users: { full_name: "$user_data.full_name" },
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();
    const normalized = reviews.map((r: any) => {
      const { _id, user_data, ...rest } = r;
      return {
        id: _id?.toString() ?? "",
        ...rest,
        users: user_data ? { full_name: user_data.full_name } : undefined,
      };
    });
    return jsonResponse(normalized);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = reviewSchema.parse(body);
    const result = await collections.reviews().insertOne({
      user_id: user.id,
      product_id: payload.product_id,
      rating: payload.rating,
      title: payload.title || null,
      body: payload.body,
      created_at: new Date(),
    });
    const inserted: any = await collections.reviews().findOne({ _id: result.insertedId });
    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
