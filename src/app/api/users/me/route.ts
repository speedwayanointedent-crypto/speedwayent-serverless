import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const doc = await collections.users().findOne(
      { _id: toObjectId(user.id) as any },
      { projection: { password_hash: 0 } }
    );
    if (!doc) throw ApiError.notFound("User not found");
    return jsonResponse({
      id: doc._id.toString(),
      email: doc.email,
      full_name: doc.full_name,
      role: doc.role,
      email_verified: doc.email_verified,
      created_at: doc.created_at,
    });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = z
      .object({
        full_name: z.string().min(1).max(120).optional(),
        email: z.string().email().optional(),
      })
      .parse(body);

    const updateFields = { ...payload, updated_at: new Date() };
    const result: any = await collections.users().findOneAndUpdate(
      { _id: toObjectId(user.id) as any },
      { $set: updateFields },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );

    if (!result) throw ApiError.notFound("User not found");
    return jsonResponse({
      id: result._id.toString(),
      email: result.email,
      full_name: result.full_name,
      role: result.role,
    });
  });
}
