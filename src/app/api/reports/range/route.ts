import { type NextRequest } from "next/server";
import { z } from "zod";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";
import { aggregateSales } from "../_helpers";

export const dynamic = "force-dynamic";

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);
    const body = await req.json().catch(() => ({}));
    const { from, to } = rangeSchema.parse(body);
    const data = await aggregateSales(from, to);
    return jsonResponse(data);
  });
}
