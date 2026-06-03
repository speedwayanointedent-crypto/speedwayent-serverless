import { type NextRequest } from "next/server";
import { z } from "zod";
import { collections, serializeDoc, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const yearSchema = z.object({ label: z.string().min(4) });

export async function GET() {
  return withErrorHandling(async () => {
    const data = await collections.years().find({}).toArray();
    const normalized = data.map((y: any) => {
      y.id = String(y._id);
      y._id = undefined;
      return y;
    });
    return jsonResponse(normalized);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, ["admin", "manager"]);
    const body = await req.json().catch(() => ({}));
    const payload = yearSchema.parse(body);
    const result = await collections.years().insertOne({ ...payload, created_at: new Date() });
    const inserted = await collections.years().findOne({ _id: result.insertedId });
    return jsonResponse(serializeDoc(inserted), { status: 201 });
  });
}
