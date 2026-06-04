import { type NextRequest } from "next/server";
import { collections, toObjectId } from "@/lib/mongodb";
import { ApiError, withErrorHandling, jsonResponse } from "@/lib/errors";
import { requireRole } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function parseCsv(raw: string) {
  const rows = String(raw || "").trim().split(/\r?\n/).filter(Boolean);
  if (rows.length === 0) return [];
  const header = rows[0].split(",").map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const values = row.split(",").map((v) => v.trim());
    const entry: any = {};
    header.forEach((key, idx) => {
      entry[key] = values[idx] ?? "";
    });
    return entry;
  });
}

async function getOrCreateByName(collection: string, name: string, extra: any = {}) {
  if (!name) return null;
  const existing = await (collections as any)[collection]().findOne({ name });
  if (existing) return existing;
  const result = await (collections as any)[collection]().insertOne({
    name,
    ...extra,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return { ...extra, _id: result.insertedId, name };
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireRole(req, "admin");
    const body = await req.json().catch(() => ({}));
    const rows = Array.isArray(body?.items) ? body.items : parseCsv(body?.csv || "");
    if (!rows.length) throw ApiError.badRequest("No rows to import");

    let count = 0;
    for (const row of rows) {
      const category = row.category ? await getOrCreateByName("categories", row.category) : null;
      const brand = row.brand ? await getOrCreateByName("brands", row.brand) : null;
      let model: any = null;
      if (row.model && brand?._id) {
        model = await collections.models().findOne({ name: row.model, brand_id: brand._id });
        if (!model) {
          const result = await collections.models().insertOne({
            name: row.model,
            brand_id: brand._id,
            years: [],
            gallery: [],
            created_at: new Date(),
            updated_at: new Date(),
          });
          model = { _id: result.insertedId };
        }
      }
      const year = row.year ? await collections.years().findOne({ label: row.year }) : null;

      await collections.products().insertOne({
        name: row.name,
        category_id: category?._id || null,
        brand_id: brand?._id || null,
        model_id: model?._id || null,
        year_id: year?._id || null,
        price: Number(row.price || 0),
        cost_price: row.cost_price ? Number(row.cost_price) : null,
        quantity: Number(row.quantity || 0),
        description: row.description || null,
        image_url: row.image_url || null,
        status: row.status || "active",
        gallery: [],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
      count++;
    }
    return jsonResponse({ count }, { status: 201 });
  });
}
