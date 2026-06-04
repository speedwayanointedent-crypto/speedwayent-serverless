import { type NextRequest } from "next/server";
import { collections, serializeDoc } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const wishlist = await ensureWishlist(user.id);
    const items = await collections
      .wishlistItems()
      .aggregate([
        { $match: { wishlist_id: wishlist._id } },
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
              id: { $toString: "$product_data._id" },
              name: "$product_data.name",
              price: "$product_data.price",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity",
            },
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();
    const normalizedItems = items.map((it: any) => {
      const { _id, ...rest } = it;
      return { id: _id?.toString() ?? "", ...rest };
    });
    return jsonResponse({ wishlist: serializeDoc(wishlist), items: normalizedItems });
  });
}
