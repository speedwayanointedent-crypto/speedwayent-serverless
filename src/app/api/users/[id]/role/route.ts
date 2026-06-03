import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireRole(req, "admin");
    const body = await req.json().catch(() => ({}));
    const role = z.enum(["admin", "manager", "staff", "customer"]).parse(body.role);

    const result: any = await collections.users().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { role, updated_at: new Date() } },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );
    if (!result) throw ApiError.notFound("User not found");

    await logAudit(
      {
        user_id: user.id,
        user_email: user.email,
        action: "update_role",
        resource: "user",
        resource_id: result._id.toString(),
        details: { new_role: role },
      },
      req
    );

    return jsonResponse({
      id: result._id.toString(),
      email: result.email,
      full_name: result.full_name,
      role: result.role,
    });
  });
}
