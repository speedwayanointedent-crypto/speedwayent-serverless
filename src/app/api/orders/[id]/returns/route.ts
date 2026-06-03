import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const reason = z.string().min(4).parse(body.reason);

    const order: any = await collections.orders().findOne({
      _id: toObjectId(id) as any,
      user_id: user.id,
    });
    if (!order) throw ApiError.notFound("Order not found");

    const result = await collections.orderReturns().insertOne({
      order_id: order._id,
      user_id: user.id,
      reason,
      status: "requested",
      amount: order.total,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "return_requested",
        resource: "order",
        resource_id: order._id.toString(),
        details: { reason },
      },
      req
    );

    const inserted = await collections.orderReturns().findOne({ _id: result.insertedId });
    return jsonResponse(inserted, { status: 201 });
  });
}
