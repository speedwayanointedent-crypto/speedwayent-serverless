import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);

    const sales = await collections
      .sales()
      .aggregate([
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
            product_id: 1,
            total: 1,
            quantity: 1,
            name: "$product_data.name",
          },
        },
      ])
      .toArray();

    const bucket = new Map<string, { product_id: string; name: string; total: number; quantity: number }>();
    sales.forEach((s: any) => {
      const key = s.product_id?.toString();
      const current = bucket.get(key) || {
        product_id: key,
        name: s.name || "Unknown",
        total: 0,
        quantity: 0,
      };
      bucket.set(key, {
        ...current,
        total: current.total + Number(s.total || 0),
        quantity: current.quantity + Number(s.quantity || 0),
      });
    });

    const rows = Array.from(bucket.values()).sort((a, b) => b.total - a.total);
    return jsonResponse(rows);
  });
}
