import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const couponSchema = z.object({
  code: z.string().min(3).max(32),
  description: z.string().optional().nullable(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  min_order: z.number().optional().nullable(),
  max_discount: z.number().optional().nullable(),
  usage_limit: z.number().int().optional().nullable(),
  per_user_limit: z.number().int().optional().nullable(),
  start_at: z.string().datetime().optional().nullable(),
  end_at: z.string().datetime().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const coupons = await collections
      .coupons()
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    return jsonResponse(coupons);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const body = await req.json().catch(() => ({}));
    const payload = couponSchema.parse(body);
    const result = await collections.coupons().insertOne({
      ...payload,
      code: payload.code.toUpperCase(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    const inserted = await collections.coupons().findOne({ _id: result.insertedId });
    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
