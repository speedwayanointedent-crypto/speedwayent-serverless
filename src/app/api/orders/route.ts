import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, toObjectId } from "@/lib/mongodb";
import { withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth, requireRole } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const orderItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive(),
  coupon_code: z.string().optional().nullable(),
  shipping_fee: z.number().optional().nullable(),
  delivery_address_id: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const { items, total, coupon_code, shipping_fee, delivery_address_id } =
      orderSchema.parse(body);
    const userId = user.id;
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
    let discountTotal = 0;
    let appliedCoupon: any = null;

    if (coupon_code) {
      const coupon: any = await collections.coupons().findOne({
        code: coupon_code.toUpperCase(),
        active: true,
      });
      if (coupon) {
        const rawDiscount =
          coupon.type === "percent"
            ? (subtotal * Number(coupon.value)) / 100
            : Number(coupon.value);
        const capped = coupon.max_discount
          ? Math.min(rawDiscount, Number(coupon.max_discount))
          : rawDiscount;
        discountTotal = Math.max(0, Number(capped.toFixed(2)));
        appliedCoupon = coupon;
      }
    }

    const computedTotal = Math.max(0, subtotal - discountTotal) + Number(shipping_fee || 0);
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const orderResult = await collections.orders().insertOne({
      user_id: userId,
      total: computedTotal,
      subtotal,
      discount_total: discountTotal,
      coupon_code: appliedCoupon?.code || null,
      shipping_fee: shipping_fee || 0,
      delivery_address_id: delivery_address_id || null,
      status: "pending",
      estimated_delivery_date: estimatedDelivery.toISOString().slice(0, 10),
      created_at: new Date(),
      updated_at: new Date(),
    });
    const orderId = orderResult.insertedId;

    const orderItems = items.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
      total: it.quantity * it.price,
    }));
    await collections.orderItems().insertMany(orderItems);

    await collections.orderStatusEvents().insertOne({
      order_id: orderId,
      status: "pending",
      note: "Order placed",
      created_at: new Date(),
    });

    await collections.notifications().insertOne({
      user_id: userId,
      title: `Order #${orderId.toString().padStart(4, "0")} placed`,
      body: `We received your order totaling GHS ${total}.`,
      type: "order",
      read: false,
      created_at: new Date(),
    });

    await logAudit(
      {
        user_id: userId,
        user_email: user.email,
        action: "create",
        resource: "order",
        resource_id: orderId.toString(),
        details: { total },
      },
      req
    );

    for (const it of items) {
      await collections.inventory().insertOne({
        product_id: it.product_id,
        quantity: -it.quantity,
        reason: "online_order",
        reference: orderId.toString(),
        created_at: new Date(),
      });
    }

    const userProfile: any = await collections.users().findOne(
      { _id: toObjectId(userId) as any },
      { projection: { email: 1 } }
    );
    if (userProfile?.email) {
      sendEmail({
        to: userProfile.email,
        subject: `Order #${orderId.toString()} confirmed`,
        html: `<p>Your order totaling GHS ${computedTotal} has been received.</p>`,
      }).catch((err) => console.error("[email] order confirmation failed", err));
    }
    if (ADMIN_EMAIL) {
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `New order #${orderId.toString()}`,
        html: `<p>A new order has been placed totaling GHS ${computedTotal}.</p>`,
      }).catch((err) => console.error("[email] admin notification failed", err));
    }

    if (appliedCoupon) {
      await collections.couponRedemptions().insertOne({
        coupon_id: appliedCoupon._id,
        user_id: userId,
        order_id: orderId,
        created_at: new Date(),
      });
    }

    return jsonResponse({ order_id: orderId.toString() }, { status: 201 });
  });
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager", "staff"]);
    const { searchParams } = new URL(req.url);
    const pageNum = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const offset = (pageNum - 1) * limitNum;

    const [orders, countResult] = await Promise.all([
      collections
        .orders()
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "user_data",
            },
          },
          { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              user_data: { full_name: 1, email: 1 },
            },
          },
          { $sort: { created_at: -1 } },
          { $skip: offset },
          { $limit: limitNum },
        ])
        .toArray(),
      collections.orders().countDocuments({}),
    ]);

    return jsonResponse({
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult,
        totalPages: Math.ceil((countResult || 0) / limitNum),
      },
    });
  });
}
