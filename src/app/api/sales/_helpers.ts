import { type NextRequest } from "next/server";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { type AuthUser } from "@/lib/server-auth";
import { logAudit } from "@/lib/audit";

export type SalePayload = {
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
};

export async function processSale(payload: SalePayload, user: AuthUser, req?: NextRequest) {
  const total = payload.quantity * payload.price;

  const result = await collections.sales().insertOne({
    product_id: payload.product_id || null,
    product_name: payload.product_name || null,
    quantity: payload.quantity,
    price: payload.price,
    total,
    note: payload.note,
    created_at: new Date(),
  });

  if (payload.product_id) {
    await collections.inventory().insertOne({
      product_id: payload.product_id,
      quantity: -payload.quantity,
      reason: "shop_sale",
      reference: result.insertedId.toString(),
      created_at: new Date(),
    });

    const pid = toObjectId(payload.product_id);
    if (pid) {
      await collections.products().updateOne(
        { _id: pid as any },
        { $inc: { quantity: -payload.quantity }, $set: { updated_at: new Date() } }
      );
    }
  }

  await logAudit(
    {
      user_id: user.id,
      user_email: user.email,
      action: "create",
      resource: "sale",
      resource_id: result.insertedId.toString(),
      details: { total, product_name: payload.product_name || null },
    },
    req
  );

  const inserted = await collections.sales().findOne({ _id: result.insertedId });
  return serializeDoc(inserted);
}
