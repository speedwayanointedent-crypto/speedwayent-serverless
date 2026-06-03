import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const cartItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const cartSchema = z.object({
  items: z.array(cartItemSchema),
});

async function ensureCart(userId: string) {
  let cart = await collections.cart().findOne({ user_id: userId, status: "active" });
  if (!cart) {
    const result = await collections.cart().insertOne({
      user_id: userId,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    });
    cart = { _id: result.insertedId, user_id: userId, status: "active" };
  }
  return cart;
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const cart = await ensureCart(user.id);
    const items = await collections
      .cartItems()
      .aggregate([
        { $match: { cart_id: cart._id } },
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
            quantity: 1,
            price: 1,
            "product_data._id": 1,
            "product_data.name": 1,
            "product_data.image_url": 1,
            products: {
              id: "$product_data._id",
              name: "$product_data.name",
              image_url: "$product_data.image_url",
            },
          },
        },
        { $sort: { created_at: 1 } },
      ])
      .toArray();
    return jsonResponse({ cart, items });
  });
}

export async function PUT(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = cartSchema.parse(body);
    const cart = await ensureCart(user.id);

    await collections.cartItems().deleteMany({ cart_id: cart._id });

    if (payload.items.length > 0) {
      const rows = payload.items.map((item) => ({
        cart_id: cart._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        created_at: new Date(),
      }));
      await collections.cartItems().insertMany(rows);
    }

    await collections
      .cart()
      .updateOne({ _id: cart._id }, { $set: { updated_at: new Date() } });
    return jsonResponse({ message: "Cart updated" });
  });
}
