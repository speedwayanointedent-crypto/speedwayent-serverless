import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    await requireRole(req, "admin");
    const body = await req.json().catch(() => ({}));
    const payload = couponSchema.partial().parse(body);
    const result: any = await collections.coupons().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Coupon not found");
    return jsonResponse(serializeDoc(result));
  });
}
