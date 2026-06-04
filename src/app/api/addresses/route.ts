import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, serializeDocs, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  label: z.string().max(40).optional().nullable(),
  recipient_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  address_line1: z.string().min(3),
  address_line2: z.string().max(120).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  region: z.string().max(80).optional().nullable(),
  postal_code: z.string().max(24).optional().nullable(),
  is_default: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const addresses = await collections
      .addresses()
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();
    return jsonResponse(serializeDocs(addresses));
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = addressSchema.parse(body);
    if (payload.is_default) {
      await collections
        .addresses()
        .updateMany({ user_id: user.id }, { $set: { is_default: false } });
    }
    const result = await collections.addresses().insertOne({
      ...payload,
      user_id: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const inserted = await collections.addresses().findOne({ _id: result.insertedId });
    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
