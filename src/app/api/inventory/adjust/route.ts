import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const adjustmentSchema = z.object({
  product_id: z.string(),
  delta: z.number().int(),
  reason: z.string().min(2),
  note: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = adjustmentSchema.parse(body);

    const product: any = await collections.products().findOne(
      { _id: toObjectId(payload.product_id) as any },
      { projection: { _id: 1, quantity: 1 } }
    );
    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    const nextQty = Number(product.quantity) + payload.delta;
    if (nextQty < 0) {
      throw ApiError.badRequest("Insufficient stock");
    }

    await collections.products().updateOne(
      { _id: toObjectId(payload.product_id) as any },
      { $set: { quantity: nextQty, updated_at: new Date() } }
    );

    const result = await collections.inventory().insertOne({
      product_id: payload.product_id,
      delta: payload.delta,
      reason: payload.reason,
      note: payload.note,
      actor_id: user.id,
      created_at: new Date(),
    });

    const inserted = await collections.inventory().findOne({ _id: result.insertedId });

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "inventory_adjustment",
        resource: "product",
        resource_id: payload.product_id,
        details: { delta: payload.delta, reason: payload.reason },
      },
      req
    );

    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
