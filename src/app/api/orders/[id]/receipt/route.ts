import { type NextRequest } from "next/server";
import { collections, normalizeOrder, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireAuth(req);

    const order = await collections
      .orders()
      .aggregate([
        { $match: { _id: toObjectId(id) as any } },
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
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data",
          },
        },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    if (!order || order.length === 0) throw ApiError.notFound("Order not found");

    const isOwner = order[0].user_id === user.id;
    const isAdmin = ["admin", "manager", "staff"].includes(user.role);
    if (!isOwner && !isAdmin) throw ApiError.forbidden("Forbidden");

    return jsonResponse(normalizeOrder(order[0]));
  });
}
