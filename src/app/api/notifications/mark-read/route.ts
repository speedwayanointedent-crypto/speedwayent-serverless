import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0) return jsonResponse({ message: "No notifications" });

    const objectIds = ids
      .map((id: string) => toObjectId(id))
      .filter((id: any) => id !== null);
    await collections
      .notifications()
      .updateMany(
        { _id: { $in: objectIds } as any, user_id: user.id },
        { $set: { read_at: new Date() } }
      );
    return jsonResponse({ message: "Updated" });
  });
}
