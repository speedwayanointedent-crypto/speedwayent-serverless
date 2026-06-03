import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { processSale } from "./_helpers";

export const dynamic = "force-dynamic";

const saleSchema = z
  .object({
    product_id: z.string().optional().nullable(),
    product_name: z.string().trim().min(1).optional().nullable(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    note: z.string().optional().nullable(),
  })
  .refine((payload) => payload.product_id || payload.product_name, {
    message: "Either product_id or product_name is required",
  });

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
            _id: 1,
            product_id: 1,
            product_name: 1,
            quantity: 1,
            price: 1,
            total: 1,
            note: 1,
            created_at: 1,
            products: { name: "$product_data.name" },
          },
        },
        { $sort: { created_at: -1 } },
      ])
      .toArray();
    return jsonResponse(sales);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireRole(req, ["admin", "manager", "staff"]);
    const body = await req.json().catch(() => ({}));
    const payload = saleSchema.parse(body);
    const sale = await processSale(payload, user, req);
    return jsonResponse(sale, { status: 201 });
  });
}
