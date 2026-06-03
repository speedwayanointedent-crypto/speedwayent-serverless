import { type NextRequest } from "next/server";
import { z } from "zod";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";
import { processSale } from "../_helpers";

export const dynamic = "force-dynamic";

const saleItemSchema = z
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

const batchSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  note: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireRole(req, ["admin", "manager", "staff"]);
    const body = await req.json().catch(() => ({}));
    const { items, note } = batchSaleSchema.parse(body);

    const results = [];
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    for (const item of items) {
      const saleWithNote = { ...item, note: item.note || note };
      const sale = await processSale(saleWithNote, user, req);
      results.push(sale);
    }

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "create_batch",
        resource: "sale",
        details: {
          items_count: items.length,
          total: totalAmount,
          note,
        },
      },
      req
    );

    return jsonResponse(
      {
        success: true,
        sales: results,
        summary: {
          items_count: items.length,
          total: totalAmount,
        },
      },
      { status: 201 }
    );
  });
}
