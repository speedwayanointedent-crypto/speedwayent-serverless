import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const categorySchema = z.object({
  name: z.string(),
  image_url: z.string().nullable().optional(),
  show_by_brand: z.boolean().default(true),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const raw: any = await collections.categories().findOne({ _id: toObjectId(id) as any });
    if (!raw) throw ApiError.notFound("Category not found");
    raw.id = String(raw._id);
    raw._id = undefined;
    if (raw.show_by_brand === undefined) raw.show_by_brand = true;
    return jsonResponse(raw);
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const payload = categorySchema.partial().parse(body);
    const result: any = await collections.categories().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Category not found");
    const normalized: any = serializeDoc(result) || {};
    if (normalized.show_by_brand === undefined) normalized.show_by_brand = true;
    return jsonResponse(normalized);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const result = await collections.categories().deleteOne({ _id: toObjectId(id) as any });
    if (result.deletedCount === 0) throw ApiError.notFound("Category not found");
    return new Response(null, { status: 204 });
  });
}
