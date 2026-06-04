import { type NextRequest } from "next/server";
import { collections, normalizeOrder, toObjectId } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const pageNum = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const offset = (pageNum - 1) * limitNum;

    const [orders, countResult] = await Promise.all([
      collections
        .orders()
        .aggregate(
          [
            { $match: { user_id: user.id } },
            {
              $lookup: {
                from: "order_items",
                localField: "_id",
                foreignField: "order_id",
                as: "order_items",
              },
            },
            {
              $lookup: {
                from: "order_status_events",
                localField: "_id",
                foreignField: "order_id",
                as: "order_status_events",
              },
            },
            { $sort: { created_at: -1 } },
            { $skip: offset },
            { $limit: limitNum },
          ],
          { allowDiskUse: true }
        )
        .toArray(),
      collections.orders().countDocuments({ user_id: user.id }),
    ]);

    const ordersWithProducts = await Promise.all(
      orders.map(async (order: any) => {
        const productIds = order.order_items.map((it: any) => it.product_id);
        const products = await collections
          .products()
          .find({ _id: { $in: productIds.map((id: string) => toObjectId(id)) } as any })
          .project({ name: 1, image_url: 1 })
          .toArray();

        const productMap: Record<string, any> = {};
        products.forEach((p: any) => {
          productMap[p._id.toString()] = p;
        });

        return {
          ...order,
          order_items: order.order_items.map((it: any) => ({
            ...it,
            products: productMap[it.product_id],
          })),
        };
      })
    );

    return jsonResponse({
      data: ordersWithProducts.map((o) => normalizeOrder(o)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult,
        totalPages: Math.ceil((countResult || 0) / limitNum),
      },
    });
  });
}
