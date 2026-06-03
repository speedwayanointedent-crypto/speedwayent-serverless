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
      .enum(["pending", "processing", "completed", "cancelled"])
      .parse(body.status);

    const result: any = await collections.orders().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) throw ApiError.notFound("Order not found");

    await collections.orderStatusEvents().insertOne({
      order_id: result._id,
      status,
      note: body.note || null,
      created_at: new Date(),
    });

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "status_update",
        resource: "order",
        resource_id: result._id.toString(),
        details: { status },
      },
      req
    );

    if (result?.user_id) {
      const userProfile: any = await collections.users().findOne(
        { _id: toObjectId(result.user_id) as any },
        { projection: { email: 1 } }
      );
      if (userProfile?.email) {
        sendEmail({
          to: userProfile.email,
          subject: `Order #${result._id.toString()} status: ${status}`,
          html: `<p>Your order status has been updated to <strong>${status}</strong>.</p>`,
        }).catch((err) => console.error("[email] status email failed", err));
      }
      await collections.notifications().insertOne({
        user_id: result.user_id,
        title: `Order #${result._id.toString().padStart(4, "0")} ${status}`,
        body: `Your order status is now ${status}.`,
        type: "order",
        read: false,
        created_at: new Date(),
      });
    }

    return jsonResponse(serializeDoc(result));
  });
}
