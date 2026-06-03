import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const status = z
      .enum(["requested", "approved", "rejected", "refunded"])
      .parse(body.status);

    const result: any = await collections.orderReturns().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Return not found");

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "return_status_update",
        resource: "order_return",
        resource_id: result._id.toString(),
        details: { status },
      },
      req
    );

    return jsonResponse(serializeDoc(result));
  });
}
