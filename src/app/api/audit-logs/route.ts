import { type NextRequest } from "next/server";
import { collections, normalizeAuditLogs } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const actor_id = searchParams.get("actor_id");
    const limitParam = parseInt(searchParams.get("limit") || "200") || 200;
    const limit = Math.min(1000, Math.max(1, limitParam));

    const conditions: any[] = [];
    if (action) conditions.push({ action });
    if (entity) conditions.push({ $or: [{ resource: entity }, { entity }] });
    if (actor_id) conditions.push({ $or: [{ user_id: actor_id }, { actor_id }] });
    const match = conditions.length ? { $and: conditions } : {};

    const logs = await collections
      .auditLogs()
      .aggregate(
        [
          ...(conditions.length ? [{ $match: match }] : []),
          {
            $lookup: {
              from: "users",
              localField: "actor_id",
              foreignField: "_id",
              as: "user_data",
            },
          },
          { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              actor_id: 1,
              user_id: 1,
              user_email: 1,
              action: 1,
              entity: 1,
              resource: 1,
              entity_id: 1,
              resource_id: 1,
              metadata: 1,
              details: 1,
              created_at: 1,
              user_data: { full_name: 1, email: 1 },
            },
          },
          { $sort: { created_at: -1 } },
          { $limit: limit },
        ],
        { allowDiskUse: true }
      )
      .toArray();
    return jsonResponse(normalizeAuditLogs(logs as any));
  });
}
