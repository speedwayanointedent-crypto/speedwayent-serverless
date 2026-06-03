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

export async function GET() {
  return withErrorHandling(async () => {
    const data = await collections.categories().find({}).toArray();
    const normalized = data.map((c: any) => {
      c.id = String(c._id);
      c._id = undefined;
      if (c.show_by_brand === undefined) c.show_by_brand = true;
      return c;
    });
    return jsonResponse(normalized);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = categorySchema.parse(body);
    const result = await collections.categories().insertOne({
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const inserted = await collections.categories().findOne({ _id: result.insertedId });
    const normalized: any = serializeDoc(inserted) || {};
    if (normalized.show_by_brand === undefined) normalized.show_by_brand = true;
    return jsonResponse(normalized, { status: 201 });
  });
}
