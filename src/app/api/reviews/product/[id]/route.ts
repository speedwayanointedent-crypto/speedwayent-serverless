import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const reviews = await collections
      .reviews()
      .aggregate([
        { $match: { product_id: id } },
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
            users: { full_name: "$user_data.full_name" },
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();
    return jsonResponse(reviews);
  });
}
