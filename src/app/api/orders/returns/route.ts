import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);
    const returns = await collections
      .orderReturns()
      .aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_data",
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
        { $unwind: { path: "$order_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            order_id: 1,
            user_id: 1,
            status: 1,
            reason: 1,
            amount: 1,
            created_at: 1,
            updated_at: 1,
            order_data: { _id: 1, total: 1, status: 1 },
            user_data: { full_name: 1, email: 1 },
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();
    const normalized = returns.map((r: any) => {
      const { _id, order_data, user_data, ...rest } = r;
      return {
        id: _id?.toString() ?? "",
        ...rest,
        orders: order_data
          ? { id: order_data._id?.toString() ?? "", total: order_data.total, status: order_data.status }
          : undefined,
        users: user_data
          ? { full_name: user_data.full_name, email: user_data.email }
          : undefined,
      };
    });
    return jsonResponse(normalized);
  });
}
