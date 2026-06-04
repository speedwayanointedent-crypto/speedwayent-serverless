import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email-service";

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

    if (result.user_id) {
      const customer: any = await collections
        .users()
        .findOne({ _id: toObjectId(result.user_id) as any }, { projection: { email: 1, full_name: 1 } });
      if (customer?.email) {
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        sendEmail({
          to: customer.email,
          subject: `Return ${statusLabel} — Speedway Anointed Ent`,
          html: `<p>Hi ${customer.full_name || "Customer"},</p><p>Your return request has been updated to: <strong>${statusLabel}</strong>.</p><p>If you have any questions, contact us at info@speedway.com.</p>`,
        }).catch((err) => console.error("[email] return status email failed", err));
      }
    }

    return jsonResponse(serializeDoc(result));
  });
}
