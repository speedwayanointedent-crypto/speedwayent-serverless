import { type NextRequest } from "next/server";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { aggregateSales } from "../_helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [today, week, month, year] = await Promise.all([
      aggregateSales(todayStart.toISOString(), now.toISOString()),
      aggregateSales(weekStart.toISOString(), now.toISOString()),
      aggregateSales(monthStart.toISOString(), now.toISOString()),
      aggregateSales(yearStart.toISOString(), now.toISOString()),
    ]);

    return jsonResponse({ today, week, month, year });
  });
}
