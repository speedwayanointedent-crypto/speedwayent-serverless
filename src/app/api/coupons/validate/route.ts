import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const validateSchema = z.object({
  code: z.string().min(3),
  total: z.number().positive(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const { code, total } = validateSchema.parse(body);
    const now = new Date();

    const coupon = await collections.coupons().findOne({
      code: code.toUpperCase(),
      active: true,
    });
    if (!coupon) throw ApiError.notFound("Invalid coupon");

    if (coupon.start_at && new Date(coupon.start_at) > now) {
      throw ApiError.badRequest("Coupon not active yet");
    }
    if (coupon.end_at && new Date(coupon.end_at) < now) {
      throw ApiError.badRequest("Coupon has expired");
    }
    if (coupon.min_order && total < Number(coupon.min_order)) {
      throw ApiError.badRequest("Order total too low");
    }

    const redeemedCount = await collections
      .couponRedemptions()
      .countDocuments({ coupon_id: coupon._id });
    if (coupon.usage_limit && redeemedCount >= coupon.usage_limit) {
      throw ApiError.badRequest("Coupon usage limit reached");
    }

    const userCount = await collections
      .couponRedemptions()
      .countDocuments({ coupon_id: coupon._id, user_id: user.id });
    if (coupon.per_user_limit && userCount >= coupon.per_user_limit) {
      throw ApiError.badRequest("Coupon already used");
    }

    const rawDiscount =
      coupon.type === "percent"
        ? (total * Number(coupon.value)) / 100
        : Number(coupon.value);
    const discount = coupon.max_discount
      ? Math.min(rawDiscount, Number(coupon.max_discount))
      : rawDiscount;

    return jsonResponse({
      code: coupon.code,
      discount: Math.max(0, Number(discount.toFixed(2))),
    });
  });
}
