import { type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);

    const sales = await collections
      .sales()
      .find({})
      .project({ total: 1, quantity: 1, created_at: 1 })
      .toArray();

    const bucket = new Map<string, { total: number; quantity: number }>();
    sales.forEach((s: any) => {
      const date = new Date(s.created_at);
      const key = date.toISOString().slice(0, 10);
      const current = bucket.get(key) || { total: 0, quantity: 0 };
      bucket.set(key, {
        total: current.total + Number(s.total || 0),
        quantity: current.quantity + Number(s.quantity || 0),
      });
    });

    const rows = Array.from(bucket.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return jsonResponse(rows);
  });
}
