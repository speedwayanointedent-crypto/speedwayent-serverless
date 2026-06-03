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

export async function GET() {
  return withErrorHandling(async () => {
    const data = await collections.brands().find({}).toArray();
    const normalized = data.map((b: any) => {
      b.id = String(b._id);
      b._id = undefined;
      return b;
    });
    return jsonResponse(normalized);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = brandSchema.parse(body);
    const result = await collections.brands().insertOne({
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const inserted = await collections.brands().findOne({ _id: result.insertedId });
    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
