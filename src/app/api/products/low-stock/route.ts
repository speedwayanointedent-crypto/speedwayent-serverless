import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const threshold = Math.max(0, parseInt(searchParams.get("threshold") || "5"));

    const items = await collections
      .products()
      .find({ is_deleted: { $ne: true }, quantity: { $lte: threshold } })
      .project({ _id: 1, name: 1, image_url: 1, quantity: 1, status: 1 })
      .sort({ quantity: 1, created_at: -1 })
      .limit(limit)
      .toArray();

    return jsonResponse(
      items.map((p: any) => ({
        id: p._id.toString(),
        _id: undefined,
        name: p.name,
        image_url: p.image_url,
        quantity: p.quantity,
        status: p.status,
      }))
    );
  });
}
