import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const brandSchema = z.object({
  name: z.string(),
  logo_url: z.string().nullable().optional(),
  is_hidden: z.boolean().default(false),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const brand: any = await collections.brands().findOne({ _id: toObjectId(id) as any });
    if (!brand) throw ApiError.notFound("Brand not found");
    brand.id = brand._id.toString();
    brand._id = undefined;
    return jsonResponse(brand);
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const payload = brandSchema.partial().parse(body);
    const result: any = await collections.brands().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Brand not found");
    return jsonResponse(serializeDoc(result));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const result = await collections.brands().deleteOne({ _id: toObjectId(id) as any });
    if (result.deletedCount === 0) throw ApiError.notFound("Brand not found");
    return new Response(null, { status: 204 });
  });
}
