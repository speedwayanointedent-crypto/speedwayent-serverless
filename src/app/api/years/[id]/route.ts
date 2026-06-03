import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const yearSchema = z.object({ label: z.string().min(4) });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const year: any = await collections.years().findOne({ _id: toObjectId(id) as any });
    if (!year) throw ApiError.notFound("Year not found");
    year.id = String(year._id);
    year._id = undefined;
    return jsonResponse(year);
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const payload = yearSchema.partial().parse(body);
    const result: any = await collections.years().findOneAndUpdate(
      { _id: toObjectId(id) as any },
      { $set: payload },
      { returnDocument: "after" }
    );
    if (!result) throw ApiError.notFound("Year not found");
    return jsonResponse(serializeDoc(result));
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const { id } = await params;
    const result = await collections.years().deleteOne({ _id: toObjectId(id) as any });
    if (result.deletedCount === 0) throw ApiError.notFound("Year not found");
    return new Response(null, { status: 204 });
  });
}
