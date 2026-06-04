import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  product_id: z.string(),
});

async function ensureWishlist(userId: string) {
  let wishlist = await collections.wishlist().findOne({ user_id: userId });
  if (!wishlist) {
    const result = await collections.wishlist().insertOne({
      user_id: userId,
      name: "My wishlist",
      created_at: new Date(),
    });
    wishlist = { _id: result.insertedId, user_id: userId, name: "My wishlist" };
  }
  return wishlist;
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = itemSchema.parse(body);
    const wishlist = await ensureWishlist(user.id);

    const result = await collections.wishlistItems().insertOne({
      wishlist_id: wishlist._id,
      product_id: payload.product_id,
      created_at: new Date(),
    });

    const item = await collections
      .wishlistItems()
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
            product_data: { _id: 1, name: 1, price: 1, image_url: 1, quantity: 1 },
          },
        },
      ])
      .toArray();

    const itemDoc = item[0] || {};
    const { _id, product_data, ...rest } = itemDoc as any;
    const normalized = {
      id: _id?.toString() ?? result.insertedId.toString(),
      ...rest,
      products: product_data
        ? {
            id: product_data._id?.toString(),
            name: product_data.name,
            price: product_data.price,
            image_url: product_data.image_url,
            quantity: product_data.quantity,
          }
        : undefined,
    };
    return jsonResponse(normalized, { status: 201 });
  });
}
