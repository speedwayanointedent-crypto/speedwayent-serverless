import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/server-auth";
import { z } from "zod";

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const payload = addressSchema.partial().parse(body);
    if (payload.is_default) {
      await collections
        .addresses()
        .updateMany({ user_id: user.id }, { $set: { is_default: false } });
    }
    const result: any = await collections.addresses().findOneAndUpdate(
      { _id: toObjectId(id) as any, user_id: user.id },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Address not found");
    return jsonResponse(result);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const user = await requireAuth(req);
    const result = await collections
      .addresses()
      .deleteOne({ _id: toObjectId(id) as any, user_id: user.id });
    if (result.deletedCount === 0) throw ApiError.notFound("Address not found");
    return new Response(null, { status: 204 });
  });
}
