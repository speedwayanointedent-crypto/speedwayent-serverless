import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const users = await collections
      .users()
      .find({})
      .project({ password_hash: 0 })
      .sort({ created_at: -1 })
      .toArray();
    return jsonResponse(
      users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        created_at: u.created_at,
      }))
    );
  });
}
