import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const notifications = await collections
      .notifications()
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();
    return jsonResponse(notifications);
  });
}
