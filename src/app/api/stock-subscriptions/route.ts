import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  product_id: z.string(),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const subscriptions = await collections
      .stockSubscriptions()
      .aggregate([
        { $match: { user_id: user.id } },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_data",
          },
        },
        { $unwind: { path: "$product_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            created_at: 1,
            products: {
              id: "$product_data._id",
              name: "$product_data.name",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity",
            },
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();
    return jsonResponse(subscriptions);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = subscriptionSchema.parse(body);

    const result = await collections.stockSubscriptions().insertOne({
      user_id: user.id,
      product_id: payload.product_id,
      created_at: new Date(),
    });

    const subscription = await collections
      .stockSubscriptions()
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_data",
          },
        },
        { $unwind: { path: "$product_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            created_at: 1,
            products: {
              id: "$product_data._id",
              name: "$product_data.name",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity",
            },
          },
        },
      ])
      .toArray();

    return jsonResponse(subscription[0] || { id: result.insertedId.toString() }, {
      status: 201,
    });
  });
}
