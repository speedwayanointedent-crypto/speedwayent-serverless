import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);

    const orders = await collections
      .orders()
      .aggregate([
        { $match: { status: "completed" } },
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
            user_id: 1,
            total: 1,
            "user_data.full_name": 1,
            "user_data.email": 1,
          },
        },
      ])
      .toArray();

    const bucket = new Map<string, { user_id: string; name: string; email: string; order_count: number; total_spent: number }>();
    orders.forEach((o: any) => {
      const key = o.user_id || "guest";
      const current = bucket.get(key) || {
        user_id: o.user_id,
        name: o.user_data?.full_name || "Guest",
        email: o.user_data?.email || "",
        order_count: 0,
        total_spent: 0,
      };
      bucket.set(key, {
        ...current,
        order_count: current.order_count + 1,
        total_spent: current.total_spent + Number(o.total || 0),
      });
    });

    const rows = Array.from(bucket.values()).sort((a, b) => b.total_spent - a.total_spent);
    const totalOrderCount = rows.reduce((sum, r) => sum + r.order_count, 0);
    const avgOrderValue =
      rows.length === 0 || totalOrderCount === 0
        ? 0
        : rows.reduce((sum, r) => sum + r.total_spent, 0) / totalOrderCount;

    const result = { customers: rows, avgOrderValue: Number(avgOrderValue.toFixed(2)) };
    return jsonResponse(result);
  });
}
